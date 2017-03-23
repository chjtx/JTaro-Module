/* global echarts $ */
import './main.css'
import 'jquery'
import './vendors/echarts.min.js'
import hello from './hello.html'
import a from 'a'
import { apple, banana, orange as o } from 'fruits'

var main = $('#main')[0]
// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(main)

// 指定图表的配置项和数据
var option = {
  title: {
    text: 'ECharts 入门示例'
  },
  tooltip: {},
  legend: {
    data: ['销量']
  },
  xAxis: {
    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
  },
  yAxis: {},
  series: [{
    name: '销量',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20]
  }]
}

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option)

// Hello JTaro Module
main.insertAdjacentHTML('afterend', hello)

// Show Fruits
var fruits = '<div>' + [apple, banana, o].join(', ') + '</div>'
$('#hello').after(fruits)
