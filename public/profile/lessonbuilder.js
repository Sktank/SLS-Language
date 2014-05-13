

$(function () {
    function Lesson() {
        var self = this;
        self.name = ko.observable('Untitled Lesson');
        self.newLessonName = ko.observable();
        self.nativeLanguage = ko.observable();
        self.foreignLanguage = ko.observable();
        self.topics = ko.observableArray();

        self.addTopic = function() {
            self.topics.push(new Topic());
        };

        self.saveLesson = function(data, event) {
            var self = this;
            var element = event.target;

            console.log(ko.toJSON(self.topics));
            console.log("#" + element.id);
            var id = "#" + element.id;
            if ($(id).prop("disabled"))
                return false;
            $(id).prop("disabled", true);

            //build the correct topics representation

            $.ajax({
                crossDomain: false,
                type: "POST",
                data: {
                    name: self.name(),
                    nativeLanguage: self.nativeLanguage(),
                    foreignLanguage: self.foreignLanguage(),
                    topics: ko.toJSON(self.topics)
                },
                url: "/register_lesson"
            }).success(function(data) {
                    console.log(data);
                    $(id).removeProp("disabled");
                });


        };

    }


    function Topic() {
        var self = this;

        self.name = ko.observable('Untitled Topic');

        self.nativeLanguageQuestions = ko.observableArray();
        self.nativeLanguageWords = ko.observableArray();
        self.nativeLanguagePhrases = ko.observableArray();

        self.foreignLanguageQuestions = ko.observableArray();
        self.foreignLanguageWords = ko.observableArray();
        self.foreignLanguagePhrases = ko.observableArray();

        self.addQuestion = function() {
            self.nativeLanguageQuestions.push(new Question());
            self.foreignLanguageQuestions.push(new Question());
        };

        self.addWord = function() {
            self.nativeLanguageWords.push(new Content());
            self.foreignLanguageWords.push(new Content());
        };

        self.addPhrase = function() {
            self.nativeLanguagePhrases.push(new Content());
            self.foreignLanguagePhrases.push(new Content());
        };
    }

    function Question() {
        var self = this;
        self.content = ko.observable();
        self.time = ko.observable();
    }

    function Content() {
        var self = this;
        self.content = ko.observable();
    }

    ko.applyBindings(new Lesson());
});