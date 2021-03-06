import { RenderElement } from 'core/elements';

// Элемент должен быть помещен в LinesGroup для отрисовки
export default class Line extends RenderElement {

   constructor({x2, y2}) {
      super(arguments[0])

      this.x2 = x2
      this.y2 = y2
   }

   /**
    * @override
    */
   isVisible(canvas_width, canvas_height) {
      return (this.globalX > 0 || this.globalX2 > 0) && this.globalX < canvas_width
   }

   /**
    * Функция рендер. Вызывается при каждой отрисовке элемента
    * 
    * @param {CanvasRenderingContext2D} ctx 
    * @param {Input} input 
    * @param {Number} time 
    */
   render(ctx, input, time) {
      if (ctx.globalAlpha !== this.alpha) {
         ctx.globalAlpha = this.alpha
      }

      ctx.moveTo(this.globalX, this.globalY)
      ctx.lineTo(this.globalX2, this.globalY2)
   }
}