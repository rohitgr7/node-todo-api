const expect = require('chai').expect;
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt: 333
}];

beforeEach((done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
});

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .end((err, res) => {
            if (err) {
                return done(err);
            }

            expect(res.status).to.equal(200);
            expect(res.body.text).to.equal(text);

            Todo.find({text})
                .then((todos) => {
                expect(todos.length).to.equal(1);
                expect(todos[0].text).to.equal(text);
                done();
            }).catch((e) => done(e));
        });
    });

    it('should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .end((err, res) => {
            if (err) {
                return done(err);
            }

            expect(res.status).to.equal(400);

            Todo.find().then((todos) => {
                expect(todos.length).to.equal(2);
                done();
            }).catch((e) => done(e));
        });
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todos.length).to.equal(2);
            done();
        });
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todo.text).to.equal(todos[0].text);
            done();
        });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();

        request(app)
            .get(`/todos/${hexId}`)
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get('/todos/123abc')
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        var hexId = todos[1]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .end((err, res) => {
            if (err) {
                return done(err);
            }

            expect(res.status).to.equal(200);
            expect(res.body.todo._id).to.equal(hexId);

            Todo.findById(hexId).then((todo) => {
                expect(todo).to.be.null;
                done();
            }).catch((e) => done(e));
        });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should return 404 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/123abc')
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = 'This should be the new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
            completed: true,
            text
        })
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todo.text).to.equal(text);
            expect(res.body.todo.completed).to.equal(true);
            expect(res.body.todo.completedAt).to.be.a('number');
            done();
        });
    });

    it('should clear completedAt when todo is not completed', (done) => {
        var hexId = todos[1]._id.toHexString();
        var text = 'This should be the new text!!';

        request(app)
            .patch(`/todos/${hexId}`)
            .send({
            completed: false,
            text
        })
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todo.text).to.equal(text);
            expect(res.body.todo.completed).to.equal(false);
            expect(res.body.todo.completedAt).to.be.null;
            done();
        });
    });
});
