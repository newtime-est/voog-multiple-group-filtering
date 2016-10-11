/*
  Uses voog API, ICanHaz Moustache and jquery

  Clickable filter item has to have a data attribute with the attribute being the table fields code and value being the fields value(ie. data-country="estonia"). "country" being the fields code.
*/


  //Customizable things.

  //Options with examples already placed
  var filterAttributes = {
    modelID: 1940,
    containerClass: 'ich-elements-list',
    elementClass: 'js-filter-item',
    activeClass: 'active', //ElementClasses "active" class
  };

  $(document).ready(function() {
    getFilters(filterAttributes);
  });

  //Example of a click function
  $('body').on('click','.js-filter-item', function() {
      if ($(this).hasClass('active')) {
          $(this).removeClass('active');
      } else {
          $(this).addClass('active');
      }
      var filters = {};
      $('.js-filter-item.active').each(function(i, obj) {
          selectedItem = $(obj).data();
          for (var key in selectedItem) {
              var selectedItemVal = '|' + selectedItem[key];
              // var selectedItemKey = key + '=';
              if (!filters.hasOwnProperty(key)) {
                  filters[key] = '';
              }
              filters[key] += selectedItemVal;
          }
      });
      var baseUrl = window.location.href.split('#')[0];
      if ($.param(filters)) {
          window.location.replace( baseUrl + '#' + $.param(filters));
      } else {
          window.location.hash = 'noFilter';
      }
      getFilters(filterAttributes);
  });



  /* Not ment to be customizable */
/*------------------------------------------------------------*/

  var sortObjArray = function(arr, field) {
      arr.sort(
          function compare(a,b) {
              if (a[field] < b[field])
                  return -1;
              if (a[field] > b[field])
                  return 1;
              return 0;
          }
      );
  };

  var createGroupedArray = function(arr, chunkSize) {
      var groups = [], i;
      for (i = 0; i < arr.length; i += chunkSize) {
          groups.push(arr.slice(i, i + chunkSize));
      }
      return groups;
  };

  var removeDuplicatesFromObjArray = function(arr, field) {
      var u = [];
      arr.reduce(function (a, b) {
          if (a[field] !== b[field]) u.push(b);
          return b;
      }, []);
      return u;
  };

  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

  //Core function
  function getFilters(options) {
    var allFilters = window.location.hash.substring(1);
    if (allFilters === "noFilter") {
      getAllElements(options);
    } else {
      allFilters = getQueryVariables();

      //Set active classes
      for (var key in allFilters) {
        var currentFilter = [
          key,
          allFilters[key]
        ],
        currentFilterValues = currentFilter[1].split('|').clean(""),
        currentFiltertypes = currentFilter[0];
        for (var j = 0; j < currentFilterValues.length; j++) {
          $('.'+ options.elementClass +'[data-' + currentFilter[0] + '="' + currentFilterValues[j] + '"]').addClass(options.activeClass);
        }
      }

      curFilterTypesCount = Object.keys(allFilters).length;
      if (!$.isEmptyObject(allFilters)) {
        if (curFilterTypesCount > 1) {
            getMultpleGroups(allFilters, options);
          } else {
            placeSingleFilterGroup(allFilters, options);
          }
      }

    }
  }


  //Create array for the first comparison group and for the others
  function getMultpleGroups(allFilters, options) {
      i = 0;
      var currentFirstFilter = [];
      var currentOtherFilters = [];
      for (var firstGroup in allFilters) {
        currentFirstFilter.push(firstGroup, allFilters[firstGroup]);
        break;
      }

      for (var otherGroups in allFilters) {
        i++;
        if (i == 1) continue;
        currentOtherFilters.push(otherGroups, allFilters[otherGroups]);
      }
      getFirstFilter(currentFirstFilter, currentOtherFilters, options);
  }

  function getFirstFilter(currentFirstFilter, currentOtherFilters, options) {
    var currentResponses = 0;
    currentFilterValues = currentFirstFilter[1].split('|').clean(""),
    currentFiltertype = currentFirstFilter[0];
    var requiredResponses = currentFilterValues.length;
    var elementArray = [];

    for (var j = 0; j < currentFilterValues.length; j++) {
      url = '/admin/api/elements?element_definition_id='+ options.modelID +'&per_page=250&include_values=true&language_code={{ page.language_code }}';
      url += '&q.element.values.' + currentFiltertype + '.$cont=' + currentFilterValues[j];

      $.ajax({
            url: url,
            method: 'get',
            success: function(response){
              currentResponses++;
              $.each(response, function(i, element) {
                elementArray.push(element);
                if (currentResponses === requiredResponses) {
                  filterResponse(elementArray, currentOtherFilters, options);
                }
              });
            }
      });
    }

  }

  function filterResponse(response, currentOtherFilters, options) {
    currentOtherFilters = createGroupedArray(currentOtherFilters, 2);
    var filteredObjects = [];
    $.each(response, function(i, element){
      var isMatch = true;
      $.each(currentOtherFilters, function(j, filtergroup){
        var groupType = filtergroup[0];
        var groupValue = filtergroup[1].split('|').clean("");
        var elementValues = element.values[groupType].split(', ').clean("");
        if (!matchFeature(elementValues, groupValue)) {
          isMatch = false;
        }
      });
      if (isMatch) {
        filteredObjects.push(element);
      }
    });
    sortObjArray(filteredObjects, 'id');
    filteredObjects = removeDuplicatesFromObjArray(filteredObjects, 'id');
    $('.'+options.containerClass).empty().append(ich.ichElementsList({items: filteredObjects}));
  }


  function matchFeature(elementValues, matches) {
    for (var i = matches.length - 1; i >= 0; i--) {
      var currValue = matches[i];
      if (elementValues.indexOf(currValue) > -1) {
        return true;
      }
    }
    return false;
  }



  function placeSingleFilterGroup(allFilters, options) {
    $('.'+options.containerClass).empty();
    for (var key in allFilters) {
      var curFilter = [
        key,
        allFilters[key]
      ],
      curFilterValues = curFilter[1].split('|').clean(""),
      curFiltertypes = curFilter[0];

      var elementObjects = [];
      var currentResponses = 0;
      var requiredResponses = curFilterValues.length;

      for (var j = 0; j < curFilterValues.length; j++) {
          $('.js-filter-item[data-' + curFilter[0] + '="' + curFilterValues[j] + '"]').addClass(options.activeClass);
          url = '/admin/api/elements?element_definition_id='+ options.modelID +'&per_page=250&include_values=true&language_code={{ page.language_code }}';
          url += '&q.element.values.' + curFilter[0] + '.$cont=' + curFilterValues[j];
          $.ajax({
            url: url,
            method: 'get',
            success: function(response){
              currentResponses++;
              $.each(response, function(i, element) {
                elementObjects.push(element);
              });
              if (currentResponses === requiredResponses) {
                sortObjArray(elementObjects, 'id');
                elementObjects = removeDuplicatesFromObjArray(elementObjects, 'id');
                $('.'+options.containerClass).append(ich.ichElementsList({items: elementObjects}));
              }

            }
          });
      }
    }
  }

  function getAllElements(options) {
    url = '/admin/api/elements?element_definition_id='+ options.modelID +'&per_page=250&include_values=true&language_code={{ page.language_code }}';

    $.ajax({
      url: url,
      method: 'get',
      success: function(elements){
        $('.'+options.containerClass).empty().append(ich.ichElementsList({items: elements}));
      }
    });

  }

  function getQueryVariables() {
      if (!location.hash) return {};
      var items = location.hash.substr(1).split("&"),
          ret = {},
          tmp,index,found,levels;
      for (var i = 0; i < items.length; i++) {
          tmp = items[i].split("=");
          tmp[0] = decodeURIComponent(tmp[0]).split(']').join('');
          tmp[1] = decodeURIComponent((tmp[1]+ '').replace(/\+/g, '%20'));
          index = tmp[0].indexOf('[');
          levels = tmp[0].split('[');

          parseSubObject(ret, tmp[0], tmp[1]);
      }
      return ret;
  }

  function parseSubObject(accu, string, value) {
      var index = string.indexOf('['),
          key = string,
          tmp;
      if (index === -1) {
          accu[key] = value;
          return;
      }
      key = string.substr(0,index);
      if (!accu[key]) {
          accu[key] = {};
      }
      parseSubObject(accu[key],string.substr(index+1),value);
  }
