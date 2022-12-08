import React from "react";
import PropTypes from "prop-types";
import { ButtonGridPopover } from "../popover/ButtonGridPopover";
import { Popover } from "../popover/Popover";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { defineMessage, useIntl } from "react-intl";

const followUsPopoverTitle = defineMessage({
  id: "follow-us-popover.title",
  defaultMessage: "Follow"
});

export function FollowUsPopoverButton({ items, popoverApiRef }) {
  const intl = useIntl();
  const filteredItems = items.filter(item => !!item);

  // The button is removed if you can't place anything.
  if (filteredItems.length === 0) {
    return null;
  }

  const title = intl.formatMessage(followUsPopoverTitle);

  return (
    <Popover
      title={title}
      content={props => <ButtonGridPopover items={filteredItems} {...props} />}
      placement="top"
      offsetDistance={28}
      popoverApiRef={popoverApiRef}
    >
      {({ togglePopover, popoverVisible, triggerRef }) => (
        <ToolbarButton
          ref={triggerRef}
          icon={<LinkIcon />}
          selected={popoverVisible}
          onClick={togglePopover}
          label={title}
          preset="basic"
        />
      )}
    </Popover>
  );
}

FollowUsPopoverButton.propTypes = {
  items: PropTypes.array.isRequired,
  popoverApiRef: PropTypes.object
};
