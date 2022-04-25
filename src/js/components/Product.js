import {utils} from '../utils.js';
import {templates, select, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';

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
    thisProduct.dom.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);

  }

  initAccordion(){
    const thisProduct = this;

    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      /* prevent default action for event */
      event.preventDefault();

      /* find active product */

      //const activeProduct = document.querySelector('.product.active');
      const activeProduct = document.querySelector(select.all.menuProductsActive);

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
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });
  }

  processOrder(){
    const thisProduct = this;

    // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];

      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const processedOption = param.options[optionId];

        // is an option (optionId) within a given category (paramID) chosen in the form (formData)

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if (optionSelected) { 

          // if option is chosen and not default -- add it's price to total
          
          if (!processedOption.default) {
            price = price + processedOption.price;

          }
        }

        else {

          // if option is not chosen and default -- subtract it's price from total
          
          if (processedOption.default) {
            price = price - (processedOption.price);
          }

        }

        // find an image of a specific ingredient based on it's class .paramId-optionId

        const ingredientImage = thisProduct.dom.imageWrapper.querySelector('.'+ paramId + '-' + optionId +'');

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

    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      }
    });

    thisProduct.dom.element.dispatchEvent(event);

    /* return to default settings of product after adding to cart */

    thisProduct.dom.priceElem.innerHTML = thisProduct.priceSingle;
    thisProduct.dom.amountInputs = document.querySelectorAll('.product__wrapper input.amount');
    for (let amountInput of thisProduct.dom.amountInputs) {
      amountInput.value = 1;
    }
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.priceSingle * productSummary.amount;
    productSummary.params = thisProduct.prepareCartProductParams();

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

      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', processedOption = { label: 'Olives', price: 2, default: true }
        const processedOption = param.options[optionId];
    
        // is an option (optionId) within a given category (paramID) chosen in the form (formData)
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) { 
          params[paramId].options[optionId] = processedOption.label;
        }
        
      }
    } 
    return params;
  }
}
export default Product;