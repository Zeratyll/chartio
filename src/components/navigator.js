import { Component } from 'core'
import { Position, Rectangle, DragScaling } from 'elements'

export default class Navigator extends Component {

   constructor(height) {
      super()
      this.height = height
   }

   /**
    * @override
    */
   $onTheme(theme) {      
      this.navigator.edgeWidth = theme.map_navigator_edge_width
      this.navigator.minWidth = theme.map_navigator_min_width >>> 0
      this.navigator.edgeColor = this.border[0].color = this.border[1].color = theme.map_color1
      this.background[0].color = this.background[1].color = theme.map_color2
   }

   /**
    * @override
    */
   $build(theme, locale) {

      this.navigator = new DragScaling({
         axisX: {min: 0, max: this.$canvas.width},
         onUpdate: () => this.update(),
         w: 100,
         h: this.height,
         edgeWidth: theme.map_navigator_edge_width,
         edgeColor: theme.map_color1
      })

      this.offset = this.$canvas.width - this.scale + theme.map_navigator_edge_width
      
      this.background = [
         new Rectangle({h: this.height, color: theme.map_color2, border: {tr: 0, tl: 8, br: 0, bl: 8}, inputIgnore: true}),
         new Rectangle({h: this.height, color: theme.map_color2, border: {tr: 8, tl: 0, br: 8, bl: 0}, inputIgnore: true})
      ]

      this.border = [
         new Rectangle({h: 2, color: theme.map_color1}),
         new Rectangle({h: 2, y: this.height-2, color: theme.map_color1}),
      ]

      this.update(false)

      return new Position({
         w: this.$canvas.width,
         h: this.height,
         children: [
            ...this.background,
            ...this.border,
            this.navigator,
         ]
      })
   }

   update(event = true) {
      this.background[0].w = this.offset + this.navigator.edgeWidth
      this.background[1].x = this.navigator.x + this.navigator.w
      this.background[1].w = this.$canvas.width - this.background[1].x

      this.border[0].w = this.border[1].w = this.navigator.w
      this.border[0].x = this.border[1].x = this.navigator.x

      if (event) {
         this.emit('update')
      }
   }

   get scale() {
      return this.navigator.w + this.navigator.edgeWidth*2
   }

   set scale(value) {
      this.navigator.w = value
   }

   get offset() {
      return this.navigator.x - this.navigator.edgeWidth
   }

   set offset(value) {
      this.navigator.x = value
   }
}