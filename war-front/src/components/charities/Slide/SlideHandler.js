const SlideHandler = (stateSlide, setSlide, items) => {
  const handlePrevClick = () => {
    setSlide('currentIndex', 
      stateSlide.currentIndex === 0 ? items.length - 1 : stateSlide.currentIndex - 1
    );
  };

  const handleNextClick = () => {
    setSlide('currentIndex', 
      stateSlide.currentIndex === items.length - 1 ? 0 : stateSlide.currentIndex + 1
    );
  };

  return {
    handlePrevClick,
    handleNextClick,
  };
};

export default SlideHandler;
