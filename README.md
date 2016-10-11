# Voog multiple group filtering

Uses Voog CMS API, ICanHaz(preferably the one included here) and Jquery(recommended v1.11+).

Used for filtering elements of the same module based on their given attributes in Voog tables. Works with multiple attributes given to the same group(i.e location: Tartu, Tallinn).

# How to use?

Firstly load Jquery on your page, then IcanHaz, after that include "ich.Mustache.tags = ["|<",">|"];" into somewhere, where the icanhaz template can access them. then create an icanhaz template from which the elements html will be generated.  Then include the group filtering js file and change options and classes to what you require.

# IMPORTANT! 

The filter works based data attributes in the filter. If these are not added correctly, the filter will not function. To do this the data attribute must consist of data-*code name of the row in voog element table*="*attribute name*".
Example:

<li class="js-someclass" data-location="tartu">
  somename
</li>

