import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PeopleSidebar } from "./PeopleSidebar";
import { getMicrophonePresences } from "../../utils/microphone-presence";
import ProfileEntryPanel from "../profile-entry-panel";
import { UserProfileSidebarContainer } from "./UserProfileSidebarContainer";

export function userFromPresence(sessionId, presence, micPresences, mySessionId) {
  const meta = presence.metas[presence.metas.length - 1];
  const micPresence = micPresences.get(sessionId);
  return { id: sessionId, isMe: mySessionId === sessionId, micPresence, ...meta };
}

function usePeopleList(presences, mySessionId, micUpdateFrequency = 500) {
  const [people, setPeople] = useState([]);

  useEffect(
    () => {
      let timeout;

      function updateMicrophoneState() {
        const micPresences = getMicrophonePresences();

        setPeople(
          Object.entries(presences).map(([id, presence]) => {
            return userFromPresence(id, presence, micPresences, mySessionId);
          })
        );

        timeout = setTimeout(updateMicrophoneState, micUpdateFrequency);
      }

      updateMicrophoneState();

      return () => {
        clearTimeout(timeout);
      };
    },
    [presences, micUpdateFrequency, setPeople, mySessionId]
  );

  return people;
}

function PeopleListContainer({ hubChannel, people, onSelectPerson, onClose }) {
  const onMuteAll = useCallback(
    () => {
      for (const person of people) {
        if (person.presence === "room" && person.permissions && !person.permissions.mute_users) {
          hubChannel.mute(person.id);
        }
      }
    },
    [people, hubChannel]
  );

  return (
    <PeopleSidebar
      people={people}
      onSelectPerson={onSelectPerson}
      onClose={onClose}
      onMuteAll={onMuteAll}
      showMuteAll={hubChannel.can("mute_users")}
    />
  );
}

PeopleListContainer.propTypes = {
  onSelectPerson: PropTypes.func.isRequired,
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  people: PropTypes.array.isRequired
};

export function PeopleSidebarContainer({
  hubChannel,
  presences,
  mySessionId,
  displayNameOverride,
  store,
  mediaSearchStore,
  performConditionalSignIn,
  onCloseDialog,
  showNonHistoriedDialog,
  onClose
}) {
  const people = usePeopleList(presences, mySessionId);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const selectedPerson = people.find(person => person.id === selectedPersonId);
  const setSelectedPerson = useCallback(
    person => {
      setSelectedPersonId(person.id);
    },
    [setSelectedPersonId]
  );

  if (selectedPerson) {
    if (selectedPerson.id === mySessionId) {
      return (
        <ProfileEntryPanel
          containerType="sidebar"
          displayNameOverride={displayNameOverride}
          store={store}
          mediaSearchStore={mediaSearchStore}
          finished={() => setSelectedPersonId(null)}
          history={history}
          showBackButton
          onBack={() => setSelectedPersonId(null)}
          showNonHistoriedDialog={showNonHistoriedDialog}
        />
      );
    } else {
      return (
        <UserProfileSidebarContainer
          user={selectedPerson}
          hubChannel={hubChannel}
          performConditionalSignIn={performConditionalSignIn}
          showBackButton
          onBack={() => setSelectedPersonId(null)}
          onCloseDialog={onCloseDialog}
          showNonHistoriedDialog={showNonHistoriedDialog}
        />
      );
    }
  }

  return (
    <PeopleListContainer onSelectPerson={setSelectedPerson} onClose={onClose} hubChannel={hubChannel} people={people} />
  );
}

PeopleSidebarContainer.propTypes = {
  displayNameOverride: PropTypes.string,
  store: PropTypes.object.isRequired,
  mediaSearchStore: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  mySessionId: PropTypes.string.isRequired,
  presences: PropTypes.object.isRequired,
  performConditionalSignIn: PropTypes.func.isRequired,
  onCloseDialog: PropTypes.func.isRequired,
  showNonHistoriedDialog: PropTypes.func.isRequired
};
