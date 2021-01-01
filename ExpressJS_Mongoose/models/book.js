/**
 * schema : document의 구조가 어떻게 생겼는지 알려주는 역할
 * model : db에서 데이터를 읽고 생성하고 수정하는 프로그래밍 인터페이스
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookSchema = new Schema({
  title: String,
  author: String,
  published_date: { type: Date, defualt: Date.now }
});


/**
 * Define Model
 * : 'book' : 해당 다큐먼트가 사용 할 collection의 단수적 표현
 *            이 모델에서는 'books' collection을 사용하게 된다.
 */
module.exports = mongoose.model('book', bookSchema);


