import {templates} from '../settings.js';

class Home {
  constructor(element){
    const thisHome = this;

    thisHome.render(element);

  }

  render(element){
    const thisHome = this;
    const generatedHTML = templates.homePage();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.orderLink = document.querySelector('.link-to-order');
    thisHome.dom.bookingLink = document.querySelector('.link-to-booking');
    thisHome.dom.orderNavLink = document.querySelector('a[href="#order"]');
    thisHome.dom.bookingNavLink = document.querySelector('a[href="#booking"]');
    thisHome.dom.homeNavLink = document.querySelector('a[href="#home"]');
    thisHome.dom.orderSubpage = document.querySelector('#order');
    thisHome.dom.homeSubpage = document.querySelector('#home');
    thisHome.dom.bookingSubpage = document.querySelector('#booking');

  }
}


export default Home;