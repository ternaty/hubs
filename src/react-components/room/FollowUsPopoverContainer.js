import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { ReactComponent as FacebookIcon } from "../icons/SocialiconsFacebook.svg";
import { ReactComponent as TwitterIcon } from "../icons/SocialiconsTwitter.svg";
import { ReactComponent as InstagramIcon } from "../icons/SocialiconsInstagram.svg";
import { ReactComponent as LinkedinIcon } from "../icons/SocialiconsLinkedin.svg";
import { ReactComponent as YoutubeIcon } from "../icons/SocialiconsYoutube.svg";
import { ReactComponent as HomeIcon } from "../icons/Home.svg";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";

import { FollowUsPopoverButton } from "./FollowUsPopover";
import { FormattedMessage } from "react-intl";
import { handleExitTo2DInterstitial } from "../../utils/vr-interstitial";

export function FollowUsPopoverContainer({ scene }) {
  const [items, setItems] = useState([]);
  const popoverApiRef = useRef();

  useEffect(() => {
    function updateItems() {
      const nextItems = [
        {
          id: "instagram",
          name: "Instagram",
          icon: InstagramIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.instagram" defaultMessage="Instagram" />,
          onSelect: () => {
            window.open("https://www.instagram.com/abschiedsraum.farvel", "_blank");
          }
        },
        {
          id: "facebook",
          name: "Facebook",
          icon: FacebookIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.facebook" defaultMessage="Facebook" />,
          onSelect: () => {
            window.open("https://www.facebook.com/abschiedsraum.farvel", "_blank");
          }
        },
        {
          id: "linkedin",
          name: "Linkedin",
          icon: LinkedinIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.linkedin" defaultMessage="LinkedIn" />,
          onSelect: () => {
            window.open("https://www.linkedin.com/company/farvel-space", "_blank");
          }
        },
        {
          id: "twitter",
          name: "Twitter",
          icon: TwitterIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.twitter" defaultMessage="Twitter" />,
          onSelect: () => {
            window.open("https://twitter.com/farvel_space", "_blank");
          }
        },
        {
          id: "youtube",
          name: "Youtube",
          icon: YoutubeIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.youtube" defaultMessage="YouTube" />,
          onSelect: () => {
            window.open("https://www.youtube.com/channel/UCzSHUPfA2ZHsGUCdpGOhNBw", "_blank");
          }
        },
        {
          id: "website",
          name: "Website",
          icon: HomeIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.website" defaultMessage="Website" />,
          onSelect: () => {
            window.open("https://ternaty.com", "_blank");
          }
        },
        {
          id: "newsletter",
          name: "Newsletter",
          icon: InviteIcon,
          color: "accent2",
          label: <FormattedMessage id="followus-popover.item-type.newsletter" defaultMessage="Newsletter" />,
          onSelect: () => {
            window.open("https://ternaty.com/newsletter", "_blank");
          }
        }
      ];

      setItems(nextItems);
    }

    updateItems();

    function onFollowUsButtonClicked() {
      handleExitTo2DInterstitial(true, () => {}).then(() => {
        popoverApiRef.current.openPopover();
      });
    }

    scene.addEventListener("action_followUs", onFollowUsButtonClicked);

    return () => {
      scene.removeEventListener("action_followUs", onFollowUsButtonClicked);
    };
  }, [scene, popoverApiRef]);

  return <FollowUsPopoverButton items={items} popoverApiRef={popoverApiRef} />;
}

FollowUsPopoverContainer.propTypes = {
  scene: PropTypes.object.isRequired
};
