import Hamburger from '../../public/images/hamburger.png';
import Logo from '../../public/images/logo.png';
import Pfp from '../../public/images/pfp.png';

const Header = () => {
  const header = document.createElement('header');

  const hamburgerBtn = document.createElement('img');
  hamburgerBtn.classList = 'header_hamburgerBtn';
  hamburgerBtn.src = Hamburger;
  hamburgerBtn.addEventListener('click', () => {
    // Toggle sidebar
  })
  header.appendChild(hamburgerBtn);
  
  const logo = document.createElement('img');
  logo.classList = 'header_logo';
  logo.src = Logo;
  header.appendChild(logo);

  const logoName = document.createElement('h1');
  logoName.classList = 'header_logoName';
  logoName.textContent = 'Tasks';
  header.appendChild(logoName);

  const pfp = document.createElement('img');
  pfp.classList = 'header_pfp';
  pfp.src = Pfp;
  header.appendChild(pfp);

  root.appendChild(header);
};

export default Header;
