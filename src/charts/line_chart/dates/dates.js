import { Position, Text, Rectangle } from 'elements'
import { Visible } from 'animations'

export default class Dates {

   constructor({font_size, item_width, animation_duration}) {
      this.font_size = font_size || 14;
      this.item_width = item_width || 80;
      this.animation_duration = animation_duration || 300;

      this.dates = [];
      this.hidden_levels = [
         // [1,3,5]
         // [2,6,10]
      ];

      this.element = new Position();
   }

   update({offset, scale, dates_column, columns, hidden_columns, colors, locale}) {
      this.element.x = offset;

      if (this.scale) {
         this.prev_scale = this.scale;
      }
      this.scale = scale;
      
      this.dates = dates_column;
      this.locale = locale;

      this.updateAxis();
   }

   updateAxis() {      
      if (this.element.children.length > 0) {
         this.animate();
         return;
      }

      var children = [];
      
      for (let i = 1; i < this.dates.length; i++) {
         let date = new Date(this.dates[i]);
         let d = date.getDate();         
         let m = this.locale.month[date.getMonth()];
         
         let rect = new Rectangle({
            x: (i-1) * this.scale.x,
            w: this.item_width,
            children: [
               new Text({text: `${m} ${d}`, size: this.font_size, color: 'rgba(0, 0, 0, 0.3)', align: 'center'})
            ]
         });

         let child = new Visible({child: rect, duration: this.animation_duration});
         children.push(child);
      }

      this.element.children = children;
   }

   animate() {
      this.element.w = (this.element.children.length-1)*this.scale.x;
      this.calc_hidden();

      for (let i = 0; i < this.element.children.length; i++) {
         let element = this.element.children[i];
         element.child.x = i * this.scale.x;

         if (this.hidden.includes(i)) {
            element.forward();
         } else {
            element.reverse();
         }
      }
   }

   // Возвращает индексы скрытых элементов
   get hidden() {
      let result = [];
      for(let i in this.hidden_levels) {
         result = result.concat(this.hidden_levels[i]);
      }
      return result;
   }

   // Возвращает индексы элементов, которые показаны
   get visible() {
      let result = [];
      for (let i = 0; i < this.element.children.length; i++) {
         if (!this.hidden.includes(i)) {
            result.push(i);
         }
      }
      return result;
   }
 
   calc_hidden() {
      var all_width = (this.element.children.length)*this.scale.x;
      var visible_width = (this.element.children.length-this.hidden.length)*this.item_width;

      // Скрываем элементы
      if (this.prev_scale.x > this.scale.x) {
         console.log(123);
         
         var w = (all_width - visible_width)/(this.visible.length);
         
         if (w <= 1) {
            var visible = this.visible.slice();
            this.hidden_levels.push([]);

            for (let i = 0; i < visible.length; i++) {
               if (i%2) {
                  this.hidden_levels[this.hidden_levels.length-1].push(visible[i]);
               }
            }
         }
      }

      // Показываем элементы
      if(this.prev_scale.x < this.scale.x && this.hidden_levels.length > 0) {
         var w = (all_width - visible_width)/(this.hidden_levels[this.hidden_levels.length-1].length);

         if (w > this.item_width) {
            this.hidden_levels.splice(this.hidden_levels.length-1, 1);
         }
      }
   }
}