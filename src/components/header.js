import Hamburger from '../../public/images/hamburger.png';

const Header = () => {
  const header = document.createElement('header');

  const hamburgerBtn = document.createElement('img');
  hamburgerBtn.classList = 'header_hamburgerBtn';
  hamburgerBtn.src = Hamburger;
  // hamburgerBtn.addEventListener('click', () => {

  // })
  header.appendChild(hamburgerBtn);
  
  const logo = document.createElement('img');
  // logo.src = ;

  root.appendChild(header);
};

export default Header;
