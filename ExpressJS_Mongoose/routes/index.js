module.exports = function(app, Book) {
  // Get all books
  app.get("/api/books", (req, res) => {
    Book.find((err, books) => {
      if(err) return res.status(500).send({error: 'database failure'});
      res.json(books);
    });
  });

  // Get book by Id
  app.get("/api/books/:book_id", (req, res) => {
    Book.findOne({_id: req.params.book_id}, (err, book) => {
      if(err) return res.status(500).json({error: err});
      if(!book) return res.status(404).json({error: 'book not found'});
      res.json(book);
    })
  });

  // Get book by Author
  app.get('/api/books/author/:author', function(req, res){
    // 2nd parameter : 출력하지 않을 값은 0을 적어준다.
    Book.find({author: req.params.author}, {_id: 0},  function(err, books){
        if(err) return res.status(500).json({error: err});
        if(books.length === 0) return res.status(404).json({error: 'book not found'});
        res.json(books);
    })
});

  // Create book
  app.post("/api/books", (req, res) => {
    var book = new Book();
    book.title = req.body.title;
    book.author = req.body.author;
    book.published_date = new Date(req.body.published_date);

    book.save((err) => {
      if(err){
        console.error(err);
        res.json({result: 0});
        return;
      }

      res.json({result: 1});
    });
  });

  // Update book
  app.put("/api/books/:book_id", (req, res) => {
    Book.findById(req.params.book_id, (err, book) => {
      if(err) return res.status(500).json({error: 'database failure'});
      if(!book) return res.status(404).json({error: 'book not found'});

      if(req.body.title) book.title = req.body.title;
      if(req.body.author) book.author = req.body.author;
      if(req.body.published_date) book.published_date = req.body.published_date;

      book.save((err) => {
        if(err) res.status(500).json({error: 'failed to update'});
        res.json({message: 'book updated'});
      });
    });
  });

  // Delete book
  app.delete("/api/books/:book_id", (req, res) => {
    Book.remove({_id: req.params.book_id}, (err, output) => {
      if(err) return res.status(500).json({error: "database failure"});

      // 204: No Content
      res.status(204).end();
    })
  });

};
