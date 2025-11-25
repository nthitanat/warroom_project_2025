const WarRoomMainContentHandler = (stateWarRoomMainContent, setWarRoomMainContent) => {
  const handleTabChange = (index) => {
    setWarRoomMainContent('selectedTab', index);
  };

  const handleFocus = (index) => {
    setWarRoomMainContent('focusedCardIndex', index);
  };

  const handleBlur = () => {
    setWarRoomMainContent('focusedCardIndex', null);
  };

  return {
    handleTabChange,
    handleFocus,
    handleBlur,
  };
};

export default WarRoomMainContentHandler;
