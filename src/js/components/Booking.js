// import { render } from "sass";
import {select, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

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
    
    thisBooking.dom.datePickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.amount.datePicker.wrapper);
    console.log(thisBooking.dom.datePickerWrapper);
    thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.amount.hourPicker.wrapper);
    console.log(thisBooking.dom.hourPickerWrapper);
    
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);
    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);

    thisBooking.datePickerWidget = new DatePicker (thisBooking.dom.datePickerWrapper);
    thisBooking.hourPickerWidget = new HourPicker (thisBooking.dom.hourPickerWrapper);
    
    /* thisBooking.dom.amountWidgets.addEventListener('very-misterious-event', function() {
        
    });*/
  }

}

export default Booking;
