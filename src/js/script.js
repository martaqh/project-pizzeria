/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.dom = {};

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

    //  console.log('new Product:', thisProduct);
    }
    renderInMenu() {
      const thisProduct = this;

      /* generate HTML based on template */

      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTLM */

      thisProduct.dom.element = utils.createDOMFromHTML(generatedHTML);

      /* fund menu container */

      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */

      menuContainer.appendChild(thisProduct.dom.element);
    }

    getElements(){
      const thisProduct = this;
    
      thisProduct.dom.accordionTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);
      //console.log(thisProduct.dom.accordionTrigger);
      thisProduct.dom.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
      //console.log(thisProduct.dom.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      // console.log(thisProduct.dom.formInputs);
      thisProduct.dom.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
      //console.log(thisProduct.dom.cartButton);
      thisProduct.dom.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
      //console.log(thisProduct.dom.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);

    }

    initAccordion(){
      const thisProduct = this;

      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        /* prevent default action for event */
        event.preventDefault();

        /* find active product */

        const activeProduct = document.querySelector('.product.active');
        //console.log(activeProduct);

        /* if there is active product different than thisProduct.dom.element, remove active class form it */
        if ((activeProduct !== null) && (activeProduct !== thisProduct.dom.element)) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.dom.element */
        thisProduct.dom.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });

    }
    initOrderForm(){
      const thisProduct = this;
      //console.log('initOrderForm');

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('update', function() {
        thisProduct.processOrder();
      });
    }

    processOrder(){
      const thisProduct = this;

      // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      //console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const processedOption = param.options[optionId];
          //console.log(optionId, processedOption);

          // is an option (optionId) within a given category (paramID) chosen in the form (formData)

          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if (optionSelected) { 

            // if option is chosen and not default -- add it's price to total
            
            if (!processedOption.default) {
              price = price + processedOption.price;
              //console.log(processedOption.price);
              //console.log(price);
            }
          }

          else {

            // if option is not chosen and default -- subtract it's price from total
            
            if (processedOption.default) {
              price = price - (processedOption.price);
              console.log(processedOption.price);
              console.log(price);
            }

          }

          // find an image of a specific ingredient based on it's class .paramId-optionId

          const ingredientImage = thisProduct.dom.imageWrapper.querySelector('.'+ paramId + '-' + optionId +'');
          //console.log(ingredientImage);

          // if the ingredient has the image

          if (ingredientImage) {

            //if it's selected

            if (optionSelected) {

              // show it

              ingredientImage.classList.add(classNames.menuProduct.imageVisible);
              
              // otherwise hide it

            } else {          
              ingredientImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
        
      }
      // multiple price by amount
      price *=thisProduct.amountWidget.value;

      //NEW (cart):

      thisProduct.priceSingle = price / thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {};
      productSummary.id = thisProduct.id;
      console.log(productSummary.id);
      productSummary.name = thisProduct.data.name;
      console.log(productSummary.name);
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = productSummary.priceSingle * productSummary.amount;
      productSummary.params = thisProduct.prepareCartProductParams();
      console.log(productSummary.params);

      return productSummary;

    }

    prepareCartProductParams() {
      const thisProduct = this;

      // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      
      const params = {};
      
      // for every category (param)...
      
      for(let paramId in thisProduct.data.params) {
      
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
       
        params[paramId] = {
          label: param.label,
          options: {}
        };

        console.log(params);

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const processedOption = param.options[optionId];
          console.log(processedOption);
      
          // is an option (optionId) within a given category (paramID) chosen in the form (formData)
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          console.log(optionSelected);

          if (optionSelected) { 
            params[paramId].options = {
              [optionId]: processedOption.label,
            };
            console.log(processedOption.label);
            console.log(optionId);
          }
        }
      }
      console.log(params);   
      return params;
    }
        
  }

  
  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      console.log('AmountWidget:', thisWidget);
      console.log('constructor arguments:', element);

      
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);
      console.log(newValue);

      //thisWidget.value = settings.amountWidget.defaultValue;

      /* TODO: Add validation */

      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue>=settings.amountWidget.defaultMin && newValue<=settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        console.log(thisWidget.value);
        
      }
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
      
    }

    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    
    announce(){
      const thisWidget = this;

      const event = new Event('update');
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      console.log('new Cart', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      console.log(thisCart.dom.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);

    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);       
      });
    }

    add(menuProduct){
      const thisCart = this;

      /* generate HTML based on template */

      const generatedHTML = templates.cartProduct(menuProduct);
      console.log(generatedHTML);

      /* create element using utils.createElementFromHTLM */

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      console.log('thisCart.products:', thisCart.products);


    }

  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params; 
      
      thisCartProduct.getElements(element);
      console.log('new Cart product', thisCartProduct);
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.menuProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.menuProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.menuProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.menuProduct.remove);
    }

  }

  const app = {
    initMenu: function() {
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);
      for (let productData in thisApp.data.products){
        new Product (productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initCart: function(){
      const thisApp = this;
      const cartElement = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElement);
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
