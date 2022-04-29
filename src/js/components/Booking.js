// import { render } from "sass";
import {classNames, select, settings, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import {utils} from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.tableSelected = null;
    thisBooking.starters = [];
    
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);
    console.log(startDateParam);
    console.log(endDateParam);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    console.log(params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking 
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event   
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   
                                     + '?' + params.eventsRepeat.join('&'),
    };
    //console.log(urls);
  
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponse){
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};
    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }       
      }   
    }
    //console.log(thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour); 

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock +=.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }

  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables(event){
    const thisBooking = this;

    if (event.target.classList.contains('table')){
      if (event.target.classList.contains('booked')) {
        alert('This table is not available.'); 
      } else if (event.target.classList.contains('selected')) {
        event.target.classList.remove('selected');
      } else {
        thisBooking.tableSelected = event.target.getAttribute('data-table');
        
        for (let table of thisBooking.dom.tables){
          if (table.classList.contains('selected')) {
            table.classList.remove('selected');
          }
        }
        event.target.classList.add('selected');
      }    
    }
  }

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePickerWidget.value,
      hour: thisBooking.hourPickerWidget.value,
      table: thisBooking.tableSelected,
      duration: parseInt(thisBooking.dom.duration.value),
      ppl: parseInt(thisBooking.dom.ppl.value),
      starters: thisBooking.starters,
      phone: thisBooking.dom.phone.value,
      address:thisBooking.dom.address.value,
    };
    console.log(payload);

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true && !thisBooking.starters.includes(starter.value)) {
        thisBooking.starters.push(starter.value);
        
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsed response:', parsedResponse);
      });
    
    thisBooking.makeBooked(payload.date, payload.hour, payload.duration, parseInt(payload.table));
    console.log(thisBooking.booked);

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
    thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.amount.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.widgets.amount.booking.tables);
    thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector('.floor-plan');
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('input[name="phone"]');
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('input[name="address"]');
    thisBooking.dom.duration = thisBooking.dom.wrapper.querySelector('.hours-amount input');
    thisBooking.dom.ppl = thisBooking.dom.wrapper.querySelector('.people-amount input');
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll('input[name="starter"]');
    console.log(thisBooking.dom.starters);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.hoursAmountWidget = new AmountWidget (thisBooking.dom.hoursAmount);
    thisBooking.peopleAmountWidget = new AmountWidget (thisBooking.dom.peopleAmount);

    thisBooking.datePickerWidget = new DatePicker (thisBooking.dom.datePickerWrapper);
    thisBooking.hourPickerWidget = new HourPicker (thisBooking.dom.hourPickerWrapper);
    
    thisBooking.dom.wrapper.addEventListener('updated', function() {
      thisBooking.updateDOM();
      for (let table of thisBooking.dom.tables) {
        if (table.classList.contains('selected')) {
          table.classList.remove('selected');
        }
      }  
    });

    thisBooking.dom.tablesWrapper.addEventListener('click', function(event){
      thisBooking.initTables(event);
    });

    thisBooking.dom.wrapper.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

}


export default Booking;
