from __future__ import absolute_import, print_function

from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.http import Http404
from django.utils import timezone
from django.views.decorators.cache import never_cache

from sentry import http
from sentry.models import Integration, Identity, IdentityProvider, IdentityStatus, Organization
from sentry.utils.http import absolute_uri
from sentry.utils.signing import sign, unsign
from sentry.web.frontend.base import BaseView
from sentry.web.helpers import render_to_response

from .utils import logger, track_response_code


def build_linking_url(integration, organization, slack_id, channel_id, response_url):
    signed_params = sign(
        integration_id=integration.id,
        organization_id=organization.id,
        slack_id=slack_id,
        channel_id=channel_id,
        response_url=response_url,
    )

    return absolute_uri(
        reverse("sentry-integration-slack-link-identity", kwargs={"signed_params": signed_params})
    )


class SlackLinkIdentityView(BaseView):
    @never_cache
    def handle(self, request, signed_params):
        params = unsign(signed_params.encode("ascii", errors="ignore"))

        try:
            organization = Organization.objects.get(
                id__in=request.user.get_orgs(), id=params["organization_id"]
            )
        except Organization.DoesNotExist:
            raise Http404

        try:
            integration = Integration.objects.get(
                id=params["integration_id"], organizations=organization
            )
        except Integration.DoesNotExist:
            raise Http404

        try:
            idp = IdentityProvider.objects.get(external_id=integration.external_id, type="slack")
        except IdentityProvider.DoesNotExist:
            raise Http404

        if request.method != "POST":
            return render_to_response(
                "sentry/auth-link-identity.html",
                request=request,
                context={"organization": organization, "provider": integration.get_provider()},
            )

        # TODO(epurkhiser): We could do some fancy slack querying here to
        # render a nice linking page with info about the user their linking.

        # Link the user with the identity. Handle the case where the user is linked to a
        # different identity or the identity is linked to a different user.
        defaults = {"status": IdentityStatus.VALID, "date_verified": timezone.now()}
        try:
            identity, created = Identity.objects.get_or_create(
                idp=idp, user=request.user, external_id=params["slack_id"], defaults=defaults
            )
            if not created:
                identity.update(**defaults)
        except IntegrityError:
            Identity.reattach(idp, params["slack_id"], request.user, defaults)

        payload = {
            "replace_original": False,
            "response_type": "ephemeral",
            "text": "Your Slack identity has been linked to your Sentry account. You're good to go!",
        }

        session = http.build_session()
        req = session.post(params["response_url"], json=payload)
        status_code = req.status_code
        resp = req.json()

        # If the user took their time to link their slack account, we may no
        # longer be able to respond, and we're not guaranteed able to post into
        # the channel. Ignore Expired url errors.
        #
        # XXX(epurkhiser): Yes the error string has a space in it.
        if not resp.get("ok") and resp.get("error") != "Expired url":
            logger.error("slack.link-notify.response-error", extra={"response": resp})
        track_response_code(status_code, resp.get("ok"))

        return render_to_response(
            "sentry/slack-linked.html",
            request=request,
            context={"channel_id": params["channel_id"], "team_id": integration.external_id},
        )
