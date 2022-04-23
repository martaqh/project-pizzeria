import {select, classNames, templates, settings} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';


class Cart {
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    console.log(thisCart.dom.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);

    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);


  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);       
    });

    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this;

    /* generate HTML based on template */

    const generatedHTML = templates.cartProduct(menuProduct);

    /* create element using utils.createElementFromHTLM */

    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    console.log(thisCart.products);
    thisCart.update();
  }

  update(){
    const thisCart = this;

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let cartProduct of thisCart.products) {
      thisCart.totalNumber += cartProduct.amount;
      thisCart.subtotalPrice += cartProduct.price;
    }
    console.log('totalNumber:', thisCart.totalNumber);
    console.log('subtotalPrice:', thisCart.subtotalPrice);
    if (thisCart.totalNumber !== 0) {
      thisCart.totalPrice = thisCart.deliveryFee + thisCart.subtotalPrice;
      console.log('totalPrice:', thisCart.totalPrice);
    } else {
      thisCart.totalPrice = 0;
      thisCart.deliveryFee = 0;
    }
    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    for (let totalPricePresentation of thisCart.dom.totalPrice) {
      totalPricePresentation.innerHTML = thisCart.totalPrice;
    }
  }

  remove(productToBeRemoved) {
    const thisCart = this;
    
    productToBeRemoved.dom.wrapper.remove();

    const indexOfProductToBeRemoved = thisCart.products.indexOf(productToBeRemoved);
    
    thisCart.products.splice(indexOfProductToBeRemoved, 1);
    
    thisCart.update();
  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      address: thisCart.dom.form.address.value,
      phone: thisCart.dom.form.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
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


  }
}
export default Cart;