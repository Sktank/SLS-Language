/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 4:56 PM
 * To change this template use File | Settings | File Templates.
 */
// =========================================================
//                Queue Implementation
// =========================================================

    function QueueNode(object) {
        this.next = null;
        this.value = object;
    }

    exports.Queue = function () {
        var self = this;
        this.tail = null;
        this.head = null;
        this.length = 0;

        this.enqueue = function(object) {
            var newNode = new QueueNode(object);
            if (self.length > 0) {
                self.tail.next = newNode;
            }
            else {
                self.head = newNode;
            }
            self.tail = newNode;
            self.length = this.length + 1;
            return true;
        };

        this.dequeue = function() {
//        console.log(self.length);
            if (self.length > 0) {
                var ret = self.head.value;
                self.head = self.head.next;
                self.length = self.length - 1;
                return ret;
            }
            return null;
        };
    };

//var ku = new Queue();
//console.log(ku.dequeue());
//ku.enqueue(5);
//ku.enqueue(6);
//ku.enqueue(7);
//console.log(ku.dequeue());
//ku.enqueue(8);
//console.log(ku.dequeue());
//console.log(ku.dequeue());
//console.log(ku.dequeue());


