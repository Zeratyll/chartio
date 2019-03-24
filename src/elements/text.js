import Element from './element.js'

export default class Text extends Element {

   constructor({text, size, fontFamily, align}) {
      super(arguments[0]);
      
      this.text = text;
      this.size = size || 14;
      this.fontFamily = fontFamily || 'Arial';
      this.align = align || 'left';

      this.need_update = true;
   }

   get w() {
      return this.size * this.text.length;
   }

   set w(value) {
      this.size = value / this.text.length;
   }

   get h() {
      return this.size;
   }

   set h(value) {
      this.size = value;
   }

   isHover({x, y}) {
      return false;
   }

   render(ctx, input, time) {
      if (!this.isVisible(ctx.width)) {
         return;
      }

      // if (!this.need_update) {
      //    return;
      // }
      // this.need_update = false;

      if (ctx.globalAlpha !== this.alpha) {
         ctx.globalAlpha = this.alpha;
      }

      if (ctx.fillStyle !== this.color) {
         ctx.fillStyle = this.color;
      }

      if (ctx.font !== `${this.size}px ${this.fontFamily}`) {
         ctx.font = `${this.size}px ${this.fontFamily}`;
      }

      if (ctx.textAlign !== this.align) {
         ctx.textAlign = this.align;
      }

      ctx.fillText(this.text, this.x, this.y);
   }
}