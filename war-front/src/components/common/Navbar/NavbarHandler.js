const NavbarHandler = (stateNavbar, setNavbar) => {
  const toggleMobileMenu = () => {
    setNavbar('mobileMenuOpen', !stateNavbar.mobileMenuOpen);
  };

  return {
    toggleMobileMenu,
  };
};

export default NavbarHandler;
