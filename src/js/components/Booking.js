// import { render } from "sass";
import {select, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    
    thisBooking.render(element);
    thisBooking.initWidgets();
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.widgets.amount.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.widgets.amount.booking.hoursAmount);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);
    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);
    
    /* thisBooking.dom.amountWidgets.addEventListener('very-misterious-event', function() {
        
    });*/
  }

}

export default Booking;
