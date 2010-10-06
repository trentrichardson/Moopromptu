Plugin Name
===========

Mootools version of Impromptu for modal like prompts and forms.

![Screenshot](http://trentrichardson.com/wp-content/uploads/2010/04/Impromptu-css3-red-button.jpg)

How to use
----------

There are a couple ways to invoke Moopromptu:
The basic way:

	var myPrompt = new Impromptu(); 
	myPrompt.show('hello world!');

The shortcut way:

	$prompt.show(msg, options);

Where msg may be a string or an object of states (see documentation).

Moopromptu is also tied to Element, so the msg will be pulled from the html property of the object.

	myEl.prompt('My nice message');

Screenshots
-----------

![Screenshot 1](http://trentrichardson.com/wp-content/uploads/2010/04/Impromptu-css3-red-button.jpg)

![Screenshot 2](http://trentrichardson.com/wp-content/uploads/2009/12/Impromptu_theme.png)

Arbitrary section
-----------------

Functionality of Moopromptu is identical to jQuery Impromptu.  All options are implemented.  See the documentation for all options: 

- [Documentation and Examples](http://trentrichardson.com/Impromptu/index.php)
- [Trent Richardson Blog](http://trentrichardson.com)

