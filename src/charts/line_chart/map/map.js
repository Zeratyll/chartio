import { Event } from 'core'
import { LinesGroup, Line, Rectangle, Position } from 'elements'
import { Slide } from 'animations'
import Navigator from './navigator.js'

export default class Map extends Event {

   constructor({width, map_height, main_height, localeObserver, themeObserver, hiddenColumnsObserver}) {
      super();

      this.width = width;
      this.map_height = map_height;
      this.padding_top = 0;
      this.padding_bottom = 0;

      this.main_height = main_height;
      this.main_padding_top = 0;
      this.main_padding_bottom = 0;

      this.dates_column = [];
      this.columns = [];
      this.hidden_columns = [];
      this.colors = {};
      this.names = {}
      this.main_scale_y = 1;
      this.map_scale_y = 1;
      this.duration = 200

      localeObserver.subscribe(locale => {
         this.locale = locale;
         this.createLines();
      })

      themeObserver.subscribe(theme => {
         this.main_padding_top = theme.main_padding_top;
         this.main_padding_bottom = theme.main_padding_bottom;
         this.padding_top = theme.map_padding_top;
         this.padding_bottom = theme.map_padding_bottom;

         this.duration = theme.animation_duration_4;
         this.caclMapYScale();
         this.createLines();
         
         if (this.columns.length > 0) {
            this.emitUpdate();
         }
      })

      hiddenColumnsObserver.subscribe(([act, index]) => {
         if (act == 'hide' && this.visible_columns.length > 1) {
            this.hidden_columns.push(index);
            this.caclMapYScale();
            this.hideColumn(index);
            this.emitUpdate();
         }

         if (act == 'show') {
            let has = false
            for(let i in this.hidden_columns) {
               if (this.hidden_columns.includes(index)) {
                  has = true;
                  this.hidden_columns.splice(i, 1);
               }
            }

            if (has) {
               this.hidden_columns_count--;
               this.caclMapYScale();
               this.showColumn(index);
               this.emitUpdate();
            }
         }
      })

      this.navigator = new Navigator({width, height: map_height, themeObserver});
      this.navigator.on('offset', () => this.emitUpdate());
      this.navigator.on('scaling', () => this.emitUpdate());

      this.pointers = new Position();

      this.element = new Rectangle({
         clip: true,
         w: width,
         h: map_height,
         children: [
            this.pointers,
            this.navigator.element,
         ]
      });      
   }

   emitUpdate() {
      this.caclMainYScale();
      this.emit('update', this.update_data);
   }

   get main_offset() {
      return {
         x: -this.navigator.offset * ((this.scale.x * this.width / this.navigator.width) / this.scale.x),
         y: this.main_offset_y || 0
      }
   }

   get main_scale() {
      return {
         x: this.scale.x * this.width / this.navigator.width,
         y: this.main_scale_y,
      };
   }

   get update_data() {
      return {
         offset: this.main_offset,
         scale: this.main_scale,
         dates_column: this.dates_column,
         columns: this.columns,
         colors: this.colors,
         names: this.names,
      };
   }

   get scale() {
      return {
         x: this.data_count > 0 ? this.width/this.data_count : 0,
         y: this.map_scale_y
      }
   }

   get data_count() {
      return this.columns[0] ? this.columns[0].length-2 : 0;
   }
   
   setData({columns, colors, names}) {
      columns = columns.slice();
      this.dates_column = columns[0];
      this.columns = columns.splice(1, columns.length);
      this.colors = colors;
      this.names = names;

      this.caclMapYScale();
      this.createLines();
      this.emitUpdate();
   }

   get visible_columns() {
      var result = [];
      
      for (let i = 0; i < this.columns.length; i++) {
         if (!this.hidden_columns.includes(i)) {
            result.push(i);
         }
      }
      return result;
   }

   hideColumn(index) {
      this.pointers.children.forEach(lines_group => {
         lines_group.children.forEach(slide => {
            if (slide.column_index == index) {
               slide.toAlpha(0);
            }
            
            let new_y = this.map_height - slide.column_value * this.scale.y + this.min_y * this.scale.y - this.padding_bottom;
            if (new_y < 0 && slide.column_index !== index) {
               new_y = -new_y
            }

            slide.completed = false;
            slide.offset = -(slide.child._y - new_y);
            slide.forward()
         });
      })
   }

   showColumn(index) {
      this.pointers.children.forEach(lines_group => {
         lines_group.children.forEach(slide => {
            if (slide.column_index == index) {
               slide.toAlpha(1);
            }

            slide.offset = -slide.offset;
            slide.completed = false;
            slide.forward()
         })
      })
   }

   updateLines() {
      this.pointers.children.forEach(lines_group => {
         for (let i = 0; i < lines_group.children.length; i++) {
            const slide = lines_group.children[i];
            const slide2 = lines_group.children[i+1];

            if (!slide2) {
               continue;
            }

            if (slide.column_index == slide2.column_index) {               
               slide.child._x2 = slide2.child._x
               slide.child._y2 = slide2.child._y
            }
         }
      })
   }

   createLines() {
      var children = [];
      
      for (let c_i = 0; c_i < this.columns.length; c_i++) {
         let column = this.columns[c_i];

         let group = new LinesGroup({lineWidth: 2, color: this.colors[column[0]]});
         let lines = [];

         for (let i = 1; i < column.length; i++) {
            if (i > column.length-1) {
               break;
            }

            let y = column[i] * this.scale.y;
            let y2 = column[i+1] * this.scale.y;
            let offset = this.map_height + this.min_y * this.scale.y - this.padding_bottom;

            let child = new Slide({
               child: new Line({
                  x: (i-1) * this.scale.x,
                  x2: i * this.scale.x,
                  y: offset - y,
                  y2: offset - y2,
               }),
               duration: this.duration,
               onProgress: () => this.updateLines()
            });

            child.column_index = c_i;
            child.column_value = column[i];

            lines.push(child);
         }
         
         group.children = lines;
         children.push(group);
      };
      
      this.pointers.children = children;
   }

   // Вычисляем Y масштаб для миникарты
   caclMapYScale() {
      let items = [];
      
      for (let i = 0; i < this.columns.length; i++) {
         if (this.hidden_columns.includes(i)) {
            continue;
         }
         this.columns[i].forEach(element => items.push(element));
      }      
      
      let min_max = this.getMinMaxY(items);
      this.min_y = min_max.min;
      this.map_scale_y = (this.map_height-this.padding_top-this.padding_bottom)/(min_max.max - min_max.min)
   }
   
   // Вычисляем Y масштаб для основного графика
   caclMainYScale() {
      var visible_items = [];
      
      for (let c = 0; c < this.columns.length; c++) {
         if (this.hidden_columns.includes(c)) {
            continue;
         }
         
         for (let i = 1; i < this.columns[c].length; i++) {
            let s = 70;
            let item_x = (i-1) * this.scale.x;

            if (this.navigator.offset < item_x + s && this.navigator.offset + this.navigator.width > item_x - s) {
               visible_items.push(this.columns[c][i]);
            }
         }
      }

      var min_max = this.getMinMaxY(visible_items);
      var diff = min_max.max - min_max.min;
      this.main_scale_y = (this.main_height-this.main_padding_top-this.main_padding_bottom)/diff;
      
      this.main_offset_y = this.main_scale_y * min_max.min;
   }

   getMinMaxY(items) {
      let min = items.length == 0 ? 0 : items[items.length-1];
      let max = 0;

      items.forEach(element => {
         max = element > max ? element : max;
         min = element < min ? element : min;
      });

      return {min, max}
   }
}