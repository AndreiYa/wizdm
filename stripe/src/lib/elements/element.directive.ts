import type { StripeElement, StripeElementOptions, StripeChangeEventObject, SupportedStripeElementType } from './generic-types';
import { OnInit, OnChanges, SimpleChanges, OnDestroy, ElementRef, Input, Output, EventEmitter, Directive } from '@angular/core';
import { StripeElementsDirective, StripeElementsConfig } from './elements.directive';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import type { StripeError } from '@stripe/stripe-js';

/** 
 * Abstract generic class turning a StripeElement into an Angular component with basic features
 * To be used as the base class for all the Stripe related specific components: StripeCard...
 */
/** @dynamic - tells ngc to ignore the error on type T generated by strictEmitMetadata: true */
@Directive()
export abstract class StripeElementDirective<T extends SupportedStripeElementType> implements OnInit, OnChanges, OnDestroy {

  constructor(readonly elementType: T, private elements: StripeElementsDirective, private config: StripeElementsConfig, private ref: ElementRef<HTMLElement>) {

    if(!elements) {
      throw new Error(`
        You're attempting to use a Stripe Element out of a proper StripeElements container.
        Make sure to wrap all the controls within a wm-stripe-elements directive.
      `);
    }
  }

  /**
   * Implement this getter to provide component specific options during element creation and update
   */
  protected abstract get options(): Partial<StripeElementOptions<T>>;

  /** Assembles the element's custom classes from the classesXXX input values */
  protected get classes(): StripeElementOptions<T>['classes'] {
    return {
      base: this.classBase || this.config?.classes?.base,
      complete: this.classComplete || this.config?.classes?.complete,
      empty: this.classEmpty || this.config?.classes?.empty,
      focus: this.classFocus || this.config?.classes?.focus,
      invalid: this.classInvalid || this.config?.classes?.invalid
    };
  }

  /** Assembles the element's custom style from the styleXXX input values */
  protected get style(): StripeElementOptions<T>['style'] {

    // Automatic style detection
    if(this.styleBase === 'auto') {

      // COmputes the style of this native element
      const computed = window?.getComputedStyle(this.ref.nativeElement);
      
      // Applies the computed style to the styleBase input for the following update 
      this.styleBase = {
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontStyle: computed.fontStyle,
        fontVariant: computed.fontVariant,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        textDecoration: computed.textDecoration,
        textShadow: computed.textShadow,
        textTransform: computed.textTransform
      };
    }

    return {
      base: this.styleBase || this.config?.style?.base,
      complete: this.styleComplete || this.config?.style?.complete,
      empty: this.styleEmpty || this.config?.style?.empty,
      invalid: this.styleInvalid || this.config?.style?.invalid
    };
  }

  /** Assembles all the element's relevan options for creation/update */
  private get allOptions(): StripeElementOptions<T> {
    return { 
      disabled: this.disabled,
      classes: this.classes, 
      style: this.style, 
      ...this.options 
    } as any;
  }

  /** The stripe element */
  public element: StripeElement<T>;
  
  /** The latest change value */
  public value: StripeChangeEventObject<T>;

  /** True whenever the element is fully loaded */
  public ready: boolean = false;

  /** True whenever the element is disabled */
  public disabled: boolean = false;
  
  /** True whenever the element is focused */
  public focused: boolean;

  /** The element's locale */
  public locale: string;

  /** True whenever the element is empty */
  public get empty(): boolean {
    return !this.value || this.value.empty;
  }

  /** True whenever the element is complete and valid */
  public get complete(): boolean {
    return !!this.value && this.value.complete;
  }

  /** The StripeError or null */
  public get error(): StripeError | null {
    return !!this.value && this.value.error || null;
  }

  ngOnInit() { 

    // Keeps track of the current Elements locale
    this.locale = this.elements.locale;

    // Resets the local variables
    this.focused = this.value = undefined;

    // Creates the requested Stripe element
    this.element = this.elements.create(this.elementType as any, this.allOptions ) as any;

    // Hooks on the element's events
    this.element.on('ready',  () => { this.readyChange.emit(this.ready = true); });
    this.element.on('focus',  () => { this.focused = true; this.focusChange.emit(); });
    this.element.on('blur',   () => { this.focused = false; this.blurChange.emit(); });
    this.element.on('escape', () => { this.escapeChange.emit(); });
    (this.element as unknown as any).on('change', (value: StripeChangeEventObject<T>) => this.valueChange.emit(this.value = value) );
    
    // Mounts the element on the DOM
    this.element.mount(this.ref.nativeElement); 
  }

  ngOnChanges(changes: SimpleChanges) { 
    // Updates the element on input changes
    this.update(this.allOptions); 
  }

  ngDoCheck() {

    // Whenever the StripeElements locale has changed...
    if(this.elements.locale !== this.locale) {
      // Disposed of the current element      
      this.ngOnDestroy();
      // Creates a new element
      this.ngOnInit();
      // Updates the locale
      this.locale = this.elements.locale;
    }
  }

  ngOnDestroy() { 
    // Resets the ready flag
    this.readyChange.emit(this.ready = false); 
    // Disposes of the element    
    this.element && this.element.destroy(); 
  }

  /** Updates the element */
  public update(options: Partial<StripeElementOptions<T>>) {     
    // Updates the element
    this.element?.update(options as any); 
  }

  /** Focus the element */
  public focus() { this.element && this.element.focus(); }

  /** Blurs the element */
  public blur() { this.element && this.element.blur(); }

  /** Clears the element */
  public clear() { this.element && this.element.clear(); }

  /** Class applied to the StripeElement's container. Defaults to StripeElement */
  @Input() classBase: StripeElementOptions<T>['classes']['base'];

  /** The class name to apply when the Element is complete. Defaults to StripeElement--complete */
  @Input() classComplete: StripeElementOptions<T>['classes']['complete'];

  /** The class name to apply when the Element is empty. Defaults to StripeElement--empty */
  @Input() classEmpty: StripeElementOptions<T>['classes']['empty'];

  /** The class name to apply when the Element has focus. Defaults to StripeElement--focus */
  @Input() classFocus: StripeElementOptions<T>['classes']['focus'];

  /** The class name to apply when the Element is invalid. Defaults to StripeElement--invalid */
  @Input() classInvalid: StripeElementOptions<T>['classes']['invalid'];
  
  /** Element's custom base style.
   * @see https://stripe.com/docs/js/appendix/style
   * Setting this input value to 'auto' enables the automatic detection of the element's style */
  @Input() styleBase: StripeElementOptions<T>['style']['base'] | 'auto';
  
  /** Element's custom complete style.
   * @see https://stripe.com/docs/js/appendix/style */
  @Input() styleComplete: StripeElementOptions<T>['style']['complete'];
  
  /** Element's custom empty style.
   * @see https://stripe.com/docs/js/appendix/style */
  @Input() styleEmpty:    StripeElementOptions<T>['style']['empty'];
  
  /** Element's custom invalid style.
   * @see https://stripe.com/docs/js/appendix/style */
  @Input() styleInvalid:  StripeElementOptions<T>['style']['invalid'];

  /** Disables the control */
  @Input('disabled') set disableSetter(value: boolean) { 
    this.disabled = coerceBooleanProperty(value); 
  }

  /** Emits when fully loaded */
  @Output('ready') readyChange = new EventEmitter<boolean>(true);
  
  /** Emits when focused */
  @Output('focus') focusChange = new EventEmitter<void>();
  
  /** Emits when blurred */
  @Output('blur') blurChange = new EventEmitter<void>();

  /** Emits when escape is pressed */
  @Output('escape') escapeChange = new EventEmitter<void>();
  
  /** Emits on status changes */
  @Output('change') valueChange = new EventEmitter<StripeChangeEventObject<T>>();
}