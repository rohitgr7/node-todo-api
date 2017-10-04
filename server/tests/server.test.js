const expect = require('chai').expect;
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {app} = require('./../server');
const {todos , users , populateTodos , populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {

    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .set('x-auth' , users[0].tokens[0].token)
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
            .set('x-auth' , users[0].tokens[0].token)
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
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todos.length).to.equal(1);

            done();
        });
    });

});

describe('GET /todos/:id', () => {

    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body.todo.text).to.equal(todos[0].text);
            done();
        });
    });

    it('should not return todo doc created by other user', (done) => {
        request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });


    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();

        request(app)
            .get(`/todos/${hexId}`)
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get('/todos/123abc')
            .set('x-auth' , users[0].tokens[0].token)
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
            .set('x-auth' , users[1].tokens[0].token)
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

    it('should not remove a todo created by other user', (done) => {
        var hexId = todos[0]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .set('x-auth' , users[1].tokens[0].token)
            .end((err, res) => {
            if (err) {
                return done(err);
            }

            expect(res.status).to.equal(404);

            Todo.findById(hexId).then((todo) => {
                expect(todo).to.exist;
                done();
            }).catch((e) => done(e));
        });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .set('x-auth' , users[1].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should return 404 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/123abc')
            .set('x-auth' , users[1].tokens[0].token)
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
            .set('x-auth' , users[0].tokens[0].token)
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

    it('should not update the todo created by other user', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = 'This should be the new text';

        request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth' , users[1].tokens[0].token)
            .send({
            completed: true,
            text
        })
            .end((err , res) => {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should clear completedAt when todo is not completed', (done) => {
        var hexId = todos[1]._id.toHexString();
        var text = 'This should be the new text!!';

        request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth' , users[1].tokens[0].token)
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

describe('GET /users/me' , () => {

    it('should return user if authenticated' , (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.body._id).to.equal(users[0]._id.toHexString());
            expect(res.body.email).to.equal(users[0].email);
            done();
        });
    });

    it('should return a 401 if not authenticated' , (done) => {
        request(app)
            .get('/users/me')
            .end((err , res) => {
            expect(res.status).to.equal(401);
            expect(res.body).to.be.empty;
            done();
        });
    });

});

describe('POST /users' , () => {

    it('should create a user' , (done) => {
        var name = "Rohit"
        var email = 'example@example.com';
        var password = "123abcdef";

        request(app)
            .post('/users')
            .send({name , email , password})
            .end((err , res) => {
            if(err) {
                return done(err);
            }

            expect(res.status).to.equal(200);
            expect(res.headers['x-auth']).to.exist;
            expect(res.body.email).to.exist;
            expect(res.body.email).to.equal('example@example.com');

            User.findOne( {email} )
                .then((user) => {
                expect(user.name).to.equal(name);
                expect(user).to.exist;
                expect(user.password).to.not.equal(password);
                done();
            }).catch((e) => done(e));
        });
    });

    it('should return validation errors if request invalid' , (done) => {
        var name = "Rohit"
        var email = 'example@example';
        var password = '12345678';

        request(app)
            .post('/users')
            .send( {name , email , password} )
            .end((err , res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });

    it('should not create user if email in use' , (done) => {
        var name = "Rohit"
        var email = users[0].email;
        var password = '123qwer';

        request(app)
            .post('/users')
            .send( {name , email , password} )
            .end((err , res) => {
            expect(res.status).to.equal(400);
            done();
        });
    });

});

describe('POST /users/login' , () => {

    it('should login user and return auth token' , (done) => {
        request(app)
            .post('/users/login')
            .send({
            email: users[1].email,
            password: users[1].password
        })
            .end((err , res) => {
            expect(res.status).to.equal(200);
            expect(res.header['x-auth']).to.exist;

            if(err) {
                done(err);
            }

            User.findById(users[1]._id)
                .then((user) => {
                expect(user.tokens[1]).to.include({
                    access: 'auth',
                    token: res.headers['x-auth']
                });
                done();
            }).catch((e) => done(e));

        })
    });

    it('should reject invalid login' , (done) => {
        request(app)
            .post('/users/login')
            .send( {
            email: users[1].email,
            password: '23456ab'
        } )
            .end((err , res) => {
            expect(res.status).to.equal(400);
            expect(res.header['x-auth']).to.not.exist;
            User.findById(users[1]._id)
                .then((user) => {
                expect(user.tokens.length).to.equal(1);
                done();
            }).catch((e) => done(e));
        });
    });

});

describe('DELETE /users/me/token' , () => {

    it('should remove auth token on logout' , (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth' , users[0].tokens[0].token)
            .end((err , res) => {
            if (err) {
                done(err);
            }

            expect(res.status).to.equal(200);

            User.findById(users[0]._id)
                .then((user) => {
                expect(user.tokens.length).to.equal(0);
                done();
            }).catch((e) => done(e));
        });
    });

});
















