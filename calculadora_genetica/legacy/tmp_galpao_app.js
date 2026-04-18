var app = angular.module("app", [
  "ui.bootstrap",
  "ui.toggle",
  "pascalprecht.translate",
]);

app.config(function ($translateProvider) {
  $translateProvider.useStaticFilesLoader({
    prefix: "languages/",
    suffix: ".json",
  });

  $translateProvider.preferredLanguage("pt_PT");

  //$translateProvider.preferredLanguage('de_DE');
  // $translateProvider.determinePreferredLanguage();
  // $translateProvider.fallbackLanguage('en_US');
  // $translateProvider.fallbackLanguage("pt_PT");
});

app.config([
  "$locationProvider",
  function ($locationProvider) {
    $locationProvider.html5Mode(true);
  },
]);

app.directive("compile", [
  "$compile",
  function ($compile) {
    return function (scope, element, attrs) {
      scope.$watch(
        function (scope) {
          return scope.$eval(attrs.compile);
        },
        function (value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };
  },
]);

app.directive("toggleCheckbox", function () {
  return {
    restrict: "A",
    transclude: true,
    replace: false,
    require: "ngModel",
    priority: 1500,
    scope: {
      ngModel: "=",
    },
    link: function ($scope, $element, $attr, ctrl) {
      // update model from Element
      var updateModelFromElement = function () {
        // If modified
        var checked = $element.prop("checked");
        if (checked != ctrl.$viewValue) {
          // Update ngModel
          ctrl.$setViewValue(checked);
          $scope.$apply();
        }
      };

      // Update input from Model
      var updateElementFromModel = function (newValue) {
        // If modified
        if ($element.prop("checked") != newValue) {
          // Update button state to match model
          $element.prop("checked", newValue).change();
        }
      };

      // Observe: Element changes affect Model
      $element.on("change", function () {
        updateModelFromElement();
      });

      // Observe: ngModel for changes
      $scope.$watch("ngModel", function (newValue) {
        updateElementFromModel(newValue);
      });

      $element.bootstrapToggle({
        on: $attr.on,
        off: $attr.off,
        size: $attr.size,
        onstyle: $attr.onstyle,
        offstyle: $attr.offstyle,
        style: $attr.style,
        width: $attr.width,
        height: $attr.height,
      });
    },
  };
});
app.controller("LangCtrl", [
  "$scope",
  "$translate",
  function (scope, translate) {
    scope.changeLang = function (key) {
      translate.use(key).then(
        function (key) {
          console.log("Sprache zu " + key + " gewechselt.");
        },
        function (key) {
          console.log("Irgendwas lief schief.");
        }
      );
    };
  },
]);

app.controller("headerNavCtrl", [
  "$scope",
  function (scope) {
    scope.SpeciesImagePath = "img/budgie.png";
    scope.UpdateSpeciesImagePath = function (species) {
      this.SpeciesImagePath = "img/" + species + ".png";
    };
  },
]);

app.controller("titleCtrl", [
  "$scope",
  function (scope) {
    scope.SpeciesImagePath = "img/budgie.png";
    scope.UpdateSpeciesImagePath = function (species) {
      this.SpeciesImagePath = "img/" + species + ".png";
      this.SpeciesName = species;
    };
  },
]);
app.controller("lockCtrl", [
  "$scope",
  function (scope) {
    scope.UpdateSpecies = function (species) {
      console.log("IJSOIjaosijOAISJosaij")
      this.SpeciesName = species;
    };
  },
]);

app.controller("TabCtrl", [
  "$scope",
  "Bird",
  "Mutation",
  "GenCalcEngine",
  "ReverseGenCalcEngine",
  "$rootScope",
  "$translate",
  "$location",
  function (
    scope,
    Bird,
    Mutation,
    GenCalcEngine,
    ReverseGenCalcEngine,
    rootScope,
    translate,
    location
  ) {
    //localStorage.clear();
    scope.savedSpecies = localStorage.getItem("species");
    scope.species =
      scope.savedSpecies !== null ? JSON.parse(scope.savedSpecies) : "ringneck";
    localStorage.setItem("species", JSON.stringify(scope.species));

    scope.savedPairings = localStorage.getItem("pairings_" + scope.species);
    scope.pairings =
      scope.savedPairings !== null ? JSON.parse(scope.savedPairings) : [];
    scope.pairings.forEach(function (pairing) {
      pairing.father.__proto__ = Bird.prototype;
      pairing.father.mutations.forEach(function (mutation) {
        mutation.__proto__ = Mutation.prototype;
      });
      pairing.mother.__proto__ = Bird.prototype;
      pairing.mother.mutations.forEach(function (mutation) {
        mutation.__proto__ = Mutation.prototype;
      });
    });
    localStorage.setItem(
      "pairings_" + scope.species,
      JSON.stringify(scope.pairings)
    );

    scope.savedLastID = localStorage.getItem("lastID");
    scope.lastID =
      localStorage.getItem("lastID") !== null
        ? JSON.parse(scope.savedLastID)
        : 0;
    localStorage.setItem("lastID", JSON.stringify(scope.lastID));

    scope.UpdateSpecies = function (species) {
      scope.species = species;
      localStorage.setItem("species", JSON.stringify(species));

      scope.savedPairings = localStorage.getItem("pairings_" + species);
      scope.pairings =
        scope.savedPairings !== null ? JSON.parse(scope.savedPairings) : [];
      scope.pairings.forEach(function (pairing) {
        pairing.father.__proto__ = Bird.prototype;
        pairing.father.mutations.forEach(function (mutation) {
          mutation.__proto__ = Mutation.prototype;
        });
        pairing.mother.__proto__ = Bird.prototype;
        pairing.mother.mutations.forEach(function (mutation) {
          mutation.__proto__ = Mutation.prototype;
        });
      });
      scope.pairings.forEach(function (pairing) {
        pairing.father.RefreshCulture();
        pairing.father.mutations.forEach(function (mutation) {
          mutation.RefreshCulture();
        });
        pairing.mother.RefreshCulture();
        pairing.mother.mutations.forEach(function (mutation) {
          mutation.RefreshCulture();
        });
      });
      localStorage.setItem(
        "pairings_" + species,
        JSON.stringify(scope.pairings)
      );
    };

    scope.reverseCalculation = {
      active: "false",
      birdOfInterest: null, //new Bird('male'),
      engine: null,
      results: null,
      optimized: true,
      calcOnlyChosenAlleles: true,
      asMale: true,
      gender: "male",
    };
    //scope.reverseCalculation.engine = new ReverseGenCalcEngine(scope.reverseCalculation.birdOfInterest);
    scope.BirdOfInterestUpdateGender = function (asMale) {
      if (asMale) {
        scope.reverseCalculation.gender = "male";
      } else {
        scope.reverseCalculation.gender = "female";
      }
      scope.reverseCalculation.birdOfInterest = new Bird(
        scope.reverseCalculation.gender
      );
      scope.reverseCalculation.engine = new ReverseGenCalcEngine(
        scope.reverseCalculation.birdOfInterest
      );
    };

    scope.BirdOfInterestUpdateGender(true);

    scope.father = new Bird("male");
    scope.mother = new Bird("female");
    scope.engine = new GenCalcEngine(scope.father, scope.mother);

    scope.maleResults = null; //[];
    scope.femaleResults = null; //[];

    scope.tabs = [
      { title: "father", bird: scope.father, active: true },
      { title: "mother", bird: scope.mother },
    ];

    scope.resultTab = {
      title: "offspring",
      father: scope.father,
      mother: scope.mother,
      engine: scope.engine,
    };

    scope.lastCalculations = {
      title: "history",
      pairings: scope.pairings,
    };

    scope.resultTabDetails = [
      {
        title: "male offspring",
        gender: "male",
        engine: scope.engine,
        active: true,
      },
      { title: "female offspring", gender: "female", engine: scope.engine },
    ];

    scope.$watch(
      "father.mutations",
      function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) {
          scope.maleResults = scope.engine.CalcResults("male");
          scope.femaleResults = scope.engine.CalcResults("female");
        }
      },
      true
    );

    scope.$watch(
      "mother.mutations",
      function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) {
          scope.maleResults = scope.engine.CalcResults("male");
          scope.femaleResults = scope.engine.CalcResults("female");
        }
      },
      true
    );

    scope.$watch(
      "reverseCalculation.birdOfInterest.mutations",
      function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) {
          var scopeMutationWrapper = angular
            .element(document.getElementById("MutationWrapperBirdOfInterest"))
            .scope();
          var autosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[0]
            : null;
          var heterosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[1]
            : null;
          scope.reverseCalculation.results =
            scope.reverseCalculation.engine.CalcResults(
              scope.reverseCalculation.gender,
              scope.species,
              scope.reverseCalculation.optimized,
              scope.reverseCalculation.calcOnlyChosenAlleles,
              autosomalRecessiveMutations,
              heterosomalRecessiveMutations
            );
        }
      },
      true
    );
    scope.$watch(
      "reverseCalculation.optimized",
      function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) {
          var scopeMutationWrapper = angular
            .element(document.getElementById("MutationWrapperBirdOfInterest"))
            .scope();
          var autosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[0]
            : null;
          var heterosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[1]
            : null;
          scope.reverseCalculation.results =
            scope.reverseCalculation.engine.CalcResults(
              scope.reverseCalculation.gender,
              scope.species,
              scope.reverseCalculation.optimized,
              scope.reverseCalculation.calcOnlyChosenAlleles,
              autosomalRecessiveMutations,
              heterosomalRecessiveMutations
            );
        }
      },
      true
    );
    scope.$watch(
      "reverseCalculation.calcOnlyChosenAlleles",
      function (newVal, oldVal) {
        if (!angular.equals(newVal, oldVal)) {
          var scopeMutationWrapper = angular
            .element(document.getElementById("MutationWrapperBirdOfInterest"))
            .scope();
          var autosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[0]
            : null;
          var heterosomalRecessiveMutations = scopeMutationWrapper
            ? scopeMutationWrapper.masterData.ref_mutation_lists[1]
            : null;
          scope.reverseCalculation.results =
            scope.reverseCalculation.engine.CalcResults(
              scope.reverseCalculation.gender,
              scope.species,
              scope.reverseCalculation.optimized,
              scope.reverseCalculation.calcOnlyChosenAlleles,
              autosomalRecessiveMutations,
              heterosomalRecessiveMutations
            );
        }
      },
      true
    );

    function deepCopy(obj) {
      if (Object.prototype.toString.call(obj) === "[object Array]") {
        var out = [],
          i = 0,
          len = obj.length;
        for (; i < len; i++) {
          out[i] = arguments.callee(obj[i]);
        }
        return out;
      }
      if (typeof obj === "object") {
        var out = {},
          i;
        for (i in obj) {
          out[i] = arguments.callee(obj[i]);
        }
        return out;
      }
      return obj;
    }

    scope.SaveToStorage = function () {
      var pairingToFind = null;
      var searchPattern =
        scope.father.getMutationFullName() +
        "_" +
        scope.mother.getMutationFullName();

      scope.pairings.forEach(function (pairing) {
        if (
          pairing.father.getMutationFullName() +
          "_" +
          pairing.mother.getMutationFullName() ===
          searchPattern
        ) {
          pairingToFind = pairing;
        }
      });

      if (pairingToFind === null) {
        scope.lastID += 1;
        scope.pairings.push({
          id: scope.lastID,
          father: deepCopy(scope.father),
          mother: deepCopy(scope.mother),
          lastChange: new Date(),
        });
      } else {
        pairingToFind.lastChange = new Date();
      }
      scope.pairings.sort(function (firstItem, secondItem) {
        return (
          new Date(secondItem.lastChange).getTime() -
          new Date(firstItem.lastChange).getTime()
        );
      });
      localStorage.setItem("lastID", JSON.stringify(scope.lastID));
      localStorage.setItem(
        "pairings_" + scope.species,
        JSON.stringify(scope.pairings)
      );
    };

    scope.SaveToTxtFile = function () {
      var maleResultListText = "";
      var femaleResultListText = "";

      scope.maleResults.getOffspringList().forEach(function (element) {
        if (maleResultListText !== "") maleResultListText += "<br>\r\n";
        maleResultListText +=
          element.getPercentText() +
          " " +
          element.getMutationName() +
          " (" +
          element.getGenFormula() +
          ")";
      });

      scope.femaleResults.getOffspringList().forEach(function (element) {
        if (femaleResultListText !== "") femaleResultListText += "<br>\r\n";
        femaleResultListText +=
          element.getPercentText() +
          " " +
          element.getMutationName() +
          " (" +
          element.getGenFormula() +
          ")";
      });

      var blob = new Blob(
        [
          ("<b>1,0 " + scope.father.getMutationFullName()).trim() +
          " x 0,1 " +
          scope.mother.getMutationFullName().trim() +
          "</b><br>\r\n<br>\r\n" +
          translate.instant("male offspring") +
          ":<br>\r\n" +
          maleResultListText +
          "<br>\r\n<br>\r\n" +
          translate.instant("female offspring") +
          ":<br>\r\n" +
          femaleResultListText,
        ],
        { type: "text/html;charset=utf-8" }
      );
      saveAs(
        blob,
        scope.father.getMutationFullName().trim() +
        "_x_" +
        scope.mother.getMutationFullName().trim() +
        ".html"
      );
    };

    scope.ResetParentBirds = function () {
      scope.father.Reset();
      scope.mother.Reset();
    };

    scope.RefreshCulture = function () {
      scope.father.RefreshCulture();
      scope.mother.RefreshCulture();
      scope.maleResults = scope.engine.CalcResults("male");
      scope.femaleResults = scope.engine.CalcResults("female");

      scope.reverseCalculation.birdOfInterest.RefreshCulture();
    };

    scope.RepeatPairing = function (pairing) {
      if (pairing !== null) {
        scope.father.Reset();
        pairing.father.mutations.forEach(function (mutation) {
          scope.father.mutations[
            scope.father.getIndexOfMutation(mutation)
          ].checked = mutation.checked;
          scope.father.mutations[
            scope.father.getIndexOfMutation(mutation)
          ].isT1orT2 = mutation.isT1orT2;
        });
        scope.father.RefreshCulture();

        scope.mother.Reset();
        pairing.mother.mutations.forEach(function (mutation) {
          scope.mother.mutations[
            scope.mother.getIndexOfMutation(mutation)
          ].checked = mutation.checked;
          scope.mother.mutations[
            scope.mother.getIndexOfMutation(mutation)
          ].isT1orT2 = mutation.isT1orT2;
        });
        scope.mother.RefreshCulture();

        scope.maleResults = scope.engine.CalcResults("male");
        scope.femaleResults = scope.engine.CalcResults("female");
      }
    };

    scope.DeletePairing = function (pairingToFind) {
      if (pairingToFind !== null) {
        var iDelete = -1;
        scope.pairings.forEach(function (pairing, i) {
          if (
            pairing.father.getMutationFullName() +
            "_" +
            pairing.mother.getMutationFullName() ===
            pairingToFind.father.getMutationFullName() +
            "_" +
            pairingToFind.mother.getMutationFullName()
          ) {
            iDelete = i;
          }
        });

        if (iDelete > -1) {
          scope.pairings.splice(iDelete, 1);
          localStorage.setItem(
            "pairings_" + scope.species,
            JSON.stringify(scope.pairings)
          );
        }
      }
    };

    scope.ResetHistory = function () {
      scope.pairings = [];
      localStorage.setItem(
        "pairings_" + scope.species,
        JSON.stringify(scope.pairings)
      );
    };

    rootScope.$on("$translateChangeSuccess", function () {
      scope.father.RefreshCulture();
      scope.mother.RefreshCulture();
      scope.maleResults = scope.engine.CalcResults("male");
      scope.femaleResults = scope.engine.CalcResults("female");

      scope.reverseCalculation.birdOfInterest.RefreshCulture();

      scope.pairings.forEach(function (pairing) {
        pairing.father.RefreshCulture();
        pairing.father.mutations.forEach(function (mutation) {
          mutation.RefreshCulture();
        });
        pairing.mother.RefreshCulture();
        pairing.mother.mutations.forEach(function (mutation) {
          mutation.RefreshCulture();
        });
      });
    });

    if (location.search().hasOwnProperty("species")) {
      var paramSpecies = location.search()["species"];
      scope.UpdateSpecies(paramSpecies);
    } else if (location.search().hasOwnProperty("reverse")) {
      scope.reverseCalculation.active = location.search()["reverse"];
    }
  },
]);

function SaveToStorage() {
  var scope = angular.element(document.getElementById("MainWrap")).scope();
  scope.$apply(function () {
    scope.SaveToStorage();
  });
}

function SaveToTxtFile() {
  var scope = angular.element(document.getElementById("MainWrap")).scope();
  scope.$apply(function () {
    scope.SaveToTxtFile();
  });
}

function ResetBirds() {
  var scope = angular.element(document.getElementById("MainWrap")).scope();
  scope.$apply(function () {
    scope.ResetParentBirds();
  });
}

function UpdateSpecies(species) {
  ResetBirds();

  // keyList.splice(0, keyList.length);
  // keyList.push("ry1uoqxz");
  
  // if(window.location.pathname.includes('/calculadoras/avancadaall')){
  //   keyList.push("wo3sw7fx");
  // }else{
  //   Math.seedrandom(config.password_seed[species]);
  //   for (let i = 0; i < 100; i++) {
  //     let key = Math.random().toString(36).substring(2, 10);
  //     if(key != "0248tgk9") keyList.push(key);
  //     else{
  //       keyList.push("gk8pd2hq")
  //     }
  //   }
  // }

  var scope = angular.element(document.getElementById("translating")).scope();
  scope.$apply(function () {
    console.log("l",config.languages)
    scope.changeLang(config.languages.hasOwnProperty(species) ? config.languages[species] : "av_COLEIRO");
  });
  console.log("Especie", species);

  var scope = angular.element(document.getElementById("MainWrap")).scope();
  scope.$apply(function () {
    scope.UpdateSpecies(species);
  });

  var scope = angular.element(document.getElementById("lock")).scope();
  scope.$apply(function () {
    scope.UpdateSpecies(species);
  });

  scope = angular.element(document.getElementById("headerNavigation")).scope();
  scope.$apply(function () {
    scope.UpdateSpeciesImagePath(species);
  });

  scope = angular.element(document.getElementById("headerTitle")).scope();
  scope.$apply(function () {
    scope.UpdateSpeciesImagePath(species);
  });

  let carousel = document.getElementById("carrossel");
  carousel.innerHTML = "";

  if (config.carousel.hasOwnProperty(species)) {

    Object.entries(config.carousel[species]).forEach(v => {

      let div = document.createElement("div");
      div.className = "opcao";

      let img = document.createElement("img");
      img.className = "ebook maior";
      img.src = config.carousel_basepath + v[1];

      const p = document.createElement("p");
      p.className = "verde-gradiente nome";
      p.textContent = v[0];

      div.appendChild(img);
      div.appendChild(p);

      carousel.appendChild(div);
    });

  }

}

function Init() {
  var tmpSpecies = localStorage.getItem("species");
  RefreshCulture();
  UpdateSpecies(tmpSpecies !== null ? JSON.parse(tmpSpecies) : "ringneck");
}

function RefreshCulture() {
  var scope = angular.element(document.getElementById("MainWrap")).scope();
  scope.$apply(function () {
    scope.RefreshCulture();
  });
}

app.controller("MutationCtrl", [
  "$scope",
  function (scope) {
    scope.masterData = {
      name: "master data",
      ref_mutation_lists: [
        {
          name: "autosomal recessive",
          ref_mutations: [
             //novos 1
             {
              id: 123,
              name: "dilute",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "personata",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "taranta",
                },
                {
                  name: "fischeri",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "cockatiel",
                },
                {
                  name: "budgie",
                },
                {
                  name: "platycercus",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "dilute",
              orderBy: 1,
            },
            {
              id: 124,
              name: "clearwing",
              species: [
                {
                  name: "budgie",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "dilute",
              orderBy: 2,
            },
            {
              id: 125,
              name: "greywing",
              species: [
                {
                  name: "budgie",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "dilute",
              orderBy: 3,
            },
            {
              id: 466,
              name: "black wings",
              species: [
                  {
                      "name": "budgie"
                  }
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "dilute",
              orderBy: 4
          },
            {
              id: 467,
              name: "fullbody",
              species: [
                  // {
                  //     "name": "budgie"
                  // }
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "fullbody",
              orderBy: 1
          },

          {
              id: 468,
              name: "faded2",
              species: [
                  {
                      "name": "budgie"
                  }
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "faded2",
              orderBy: 1
          },
          {
            id: 121,
            name: "rec. pied",
            species: [
              {
                name: "ringneck",
              },
              {
                name: "alexandrine",
              },
              {
                name: "plumhead",
              },
              {
                name: "moustache",
              },
              {
                name: "derbyan",
              },
              {
                name: "fischeri",
              },
              {
                name: "personata",
              },
              {
                name: "roseicollis",
              },
              {
                name: "lilianae",
              },
              {
                name: "nigrigenis",
              },
              {
                name: "cockatiel",
              },
              {
                name: "pyrrhura_molinae",
              },
              {
                name: "budgie",
              },
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "rec. pied",
            orderBy: 1,
          },
          {
            id: 118,
            name: "dun fallow",
            species: [
              {
                name: "ringneck",
              },
              {
                name: "fischeri",
              },
              {
                name: "personata",
              },
              {
                name: "budgie",
              },
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "dun fallow",
            orderBy: 1,
          },
          {
            id: 119,
            name: "fallow",
            species: [
              {
                name: "alexandrine",
              },
              {
               name: "coleiro",
              },
              {
                name: "budgie",
              },
              {
                name: "platycercus",
              },
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "fallow",
            orderBy: 1,
          },
          {
            id: 120,
            name: "pale fallow",
            species: [
              {
                name: "moustache",
              },
              {
                name: "roseicollis",
              },
              {
                name: "taranta",
              },
              //{
              //  name: "fischeri",
              //},
              {
                name: "budgie",
              },
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "pale fallow",
            orderBy: 1,
          },
          {
            id: 105,
            name: "blue",
            species: [
              {
                name: "ringneck",
              },
              {
                name: "alexandrine",
              },
              {
                name: "plumhead",
              },
              {
                name: "moustache",
              },
              {
                name: "fischeri",
              },
              {
                name: "personata",
              },
              {
                name: "lilianae",
              },
              {
                name: "nigrigenis",
              },
              {
                name: "budgie",
              },
              {
                name: "platycercus",
              },
              {
                name: "roseicollis",
              },
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "blue",
            orderBy: 1,
          },
          {
            id: 129,
            name: "faded",
            species: [
              {
                name: "cockatiel",
              },
              {
                name: "budgie",
              },
              //{
              //  name: "fischeri",
              //},
            ],
            inheritanceMode: "autosomal recessive",
            multiAlleleBase: "faded",
            orderBy: 1,
          },
              {
                  id: 469,
                  name: "spotted",
                  species: [
                      {
                          "name": "budgie"
                      }
                  ],
                  inheritanceMode: "autosomal recessive",
                  multiAlleleBase: "spotted",
                  orderBy: 1
              },

              {
                  id: 470,
                  name: "striped",
                  species: [
                      {
                          "name": "budgie"
                      }
                  ],
                  inheritanceMode: "autosomal recessive",
                  multiAlleleBase: "striped",
                  orderBy: 1
              },
            //
             {
               id: 101,
               name: "NSLino",
               species: [
            //     {
            //       name: "ringneck",
            //     },
            //     {
            //       name: "plumhead",
            //     },
            //     {
            //       name: "moustache",
            //     },
            //     {
            //       name: "slaty-headed",
            //     },
            //     {
            //       name: "cockatiel",
            //     },
            //     {
            //       name: "budgie",
            //     },
            //     {
            //       name: "fischeri",
            //     },
                 {
                   name: "personata",
                 },
            //     {
            //       name: "lilianae",
            //     },
            //     {
            //       name: "nigrigenis",
            //     },
            //     {
            //       name: "platycercus",
            //     },
               ],
               inheritanceMode: "autosomal recessive",
               multiAlleleBase: "NSLino",
               orderBy: 1,
             },
            // {
            //   id: 102,
            //   name: "bronze fallow",
            //   species: [
            //     {
            //       name: "ringneck",
            //     },
            //     {
            //       name: "moustache",
            //     },
            //     {
            //       name: "personata",
            //     },
            //     {
            //       name: "roseicollis",
            //     },
            //     {
            //       name: "taranta",
            //     },
            //     {
            //       name: "fischeri",
            //     },
            //     {
            //       name: "cockatiel",
            //     },
            //     {
            //       name: "budgie",
            //     },
            //   ],
            //   inheritanceMode: "autosomal recessive",
            //   multiAlleleBase: "NSLino",
            //   orderBy: 4,
            // },
            {
              id: 103,
              name: "pastel",
              species: [
                //     {
                //       name: "ringneck",
                //     },
                //     {
                //       name: "fischeri",
                //     },
                //     {
                //       name: "personata",
                //     },
                //     {
                //       name: "lilianae",
                //     },
                //     {
                //       name: "nigrigenis",
                //     },
                //     {
                //       name: "roseicollis",
                //     },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "NSLino",
              orderBy: 3,
            },
            {
              id: 104,
              name: "DEC",
              species: [
                // {
                //   name: "fischeri",
                // },
                //{
                //  name: "personata",
                //},
                {
                  name: "lilianae",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "NSLino",
              orderBy: 2,
            },
            {
              id: 106,
              name: "turquoise",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "moustache",
                },//au
                {
                  name: "fischeri",
                },
                {
                  name: "personata",
                },
                 {
                   name: "roseicollis",
                 },
                {
                  name: "taranta",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "platycercus",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "blue",
              orderBy: 5,
            },
            // {
            //   id: 107,
            //   name: "aqua",
            //   species: [
            //     {
            //       name: "ringneck",
            //     },
            //     {
            //       name: "alexandrine",
            //     },
            //     {
            //       name: "plumhead",
            //     },
            //     {
            //       name: "roseicollis",
            //     },
            //   ],
            //   inheritanceMode: "autosomal recessive",
            //   multiAlleleBase: "blue",
            //   orderBy: 4,
            // },
            {
              id: 108,
              name: "indigo",
              species: [
                {
                  name: "ringneck",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "blue",
              orderBy: 3,
            },
            {
              id: 109,
              name: "sapphire",
              species: [],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "blue",
              orderBy: 2,
            },

            {
              id: 113,
              name: "whiteface",
              species: [
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "whiteface",
              orderBy: 1,
            },
            {
              id: 114,
              name: "pastelface",
              species: [
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "whiteface",
              orderBy: 3,
            },
            {
              id: 115,
              name: "creamface",
              species: [
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "whiteface",
              orderBy: 2,
            },
            {
              id: 116,
              name: "cleartail",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "cleartail",
              orderBy: 1,
            },
            {
              id: 117,
              name: "clearhead fallow",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "clearhead fallow",
              orderBy: 1,
            },
            {
              id: 122,
              name: "rec. edged",
              species: [
                //{
                //  name: "ringneck",
                //},
                {
                  name: "alexandrine",
                },
                {
                  name: "roseicollis",
                },
                // {
                //   name: "cockatiel",
                // },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. edged",
              orderBy: 1,
            },
            {
              id: 126,
              name: "rec. grey",
              species: [
                {
                  name: "alexandrine",
                },
                {
                  name: "roseicollis",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. grey",
              orderBy: 1,
            },
            {
              id: 127,
              name: "orange face",
              species: [
                {
                  name: "roseicollis",
                },
                {
                  name: "fischeri",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "orange face",
              orderBy: 1,
            },
            {
              id: 128,
              name: "rec. silver",
              species: [
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. silver",
              orderBy: 1,
            },
            {
              id: 130,
              name: "emerald",
              species: [
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "emerald",
              orderBy: 1,
            },
            {
              id: 131,
              name: "rec. grey(AUS)",
              species: [
                //{
                //  name: "budgie",
                //},
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. grey(AUS)",
              orderBy: 1,
            },
            {
              id: 132,
              name: "rec. grey(ENG)",
              species: [
                //{
                //  name: "budgie",
                //},
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. grey(ENG)",
              orderBy: 1,
            },
            {
              id: 133,
              name: "rec. pied(DNK)",
              species: [
                //{
                //  name: "budgie",
                //},
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "rec. pied(DNK)",
              orderBy: 1,
            },
            {
              id: 134,
              name: "marbled",
              species: [
                // {
                //   name: "roseicollis",
                // },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "marbled",
              orderBy: 1,
            },
            {
              id: 135,
              name: "golden",
              species: [
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "golden",
              orderBy: 1,
            },
            {
              id: 136,
              name: "melanistic",
              species: [
                // {
                //   name: "platycercus",
                // },
              ],
              inheritanceMode: "autosomal recessive",
              multiAlleleBase: "melanistic",
              orderBy: 1,
            },
          ],
          open: true,
        },
        //novos 6
        {
          name: "darkening factors",
          ref_mutations: [
            {
              id: 401,
              name: "onefator",
              species: [
                {
                  name: "fischeri",
                },
                {
                  name: "roseicollis",
                },
              ],
              inheritanceMode: "darkening factors",
              multiAlleleBase: "onefator",
              orderBy: 1,
            },
            {
              id: 402,
              name: "twofator",
              species: [
                {
                  name: "fischeri",
                },
                {
                  name: "roseicollis",
                },
              ],
              inheritanceMode: "darkening factors",
              multiAlleleBase: "twofator",
              orderBy: 1,
            },
          ],
          open: false,
        },
        {
          name: "autosomal dominant",
          ref_mutations: [
            //novos 2
            {
              id: 220,
              name: "saddleback",
              species: [
                {
                  name: "budgie",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "saddleback",
              orderBy: 1,
            },
              {
                id: 217,
                name: "clearbody",
                species: [{
                    "name": "budgie"
                }],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "clearbody",
                orderBy: 1
            },
            {
              id: 460,
              name: "melanicshimmer",
              species: [
                  // {
                  //     "name": "budgie"
                  // }
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "melanicshimmer",
              orderBy: 1
            },
            {
              id: 218,
              name: "yellowface1",
              species: [
                {
                  name: "budgie",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "yellowface1",
              orderBy: 1,
            },
            {
              id: 459,
              name: "yellowface2",
              species: [
                  {
                      "name": "budgie"
                  }
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "yellowface2",
              orderBy: 1
            },
            {
              id: 461,
              name: "goldface",
              species: [
                  {
                      "name": "budgie"
                  }
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "goldface",
              orderBy: 1
            },
            {
              id: 455,
              name: "adh",
              species: [
                  {
                      "name": "budgie"
                  }
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "adh",
              orderBy: 1
            },

            {
                id: 456,
                name: "adhfrosted",
                species: [
                    // {
                    //     "name": "budgie"
                    // }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "adhfrosted",
                orderBy: 1
            },
            {
                id: 462,
                name: "easleyclearbody",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "easleyclearbody",
                orderBy: 1
            },

            {
                id: 463,
                name: "whitecap",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "whitecap",
                orderBy: 1
            },
            {
                id: 457,
                name: "cop",
                species: [
                    // {
                    //     "name": "budgie"
                    // }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "cop",
                orderBy: 1
            },
            {
              id: 215,
              name: "dom. pied(AUS)",
              species: [
                {
                  name: "budgie",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dom. pied(AUS)",
              orderBy: 1,
            },

            {
                id: 458,
                name: "lightharlequin",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "lightharlequin",
                orderBy: 1
            },
            {
              id: 202,
              name: "violet",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                // {
                //   name: "fischeri",
                // },
                {
                  name: "personata",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "nigrigenis",
                },
                // {
                //   name: "roseicollis",
                // },
                {
                  name: "budgie",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "violet",
              orderBy: 1,
            },
            {
              id: 204,
              name: "grey",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "moustache",
                },
                {
                  name: "budgie",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "grey",
              orderBy: 1,
            },
            {
                id: 464,
                name: "greenline",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "greenline",
                orderBy: 1
            },

            {
                id: 490,
                name: "anthracite",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "autosomal dominant",
                multiAlleleBase: "anthracite",
                orderBy: 1
            },
            //
            {
              id: 201,
              name: "dark",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "moustache",
                },
                // {
                //   name: "fischeri",
                // },
                {
                  name: "personata",
                },
                // {
                //   name: "roseicollis",
                // },
                {
                  name: "taranta",
                },
                // {
                //   name: "budgie",
                // },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dark",
              orderBy: 1,
            },
            {
              id: 203,
              name: "deep",
              species: [
                {
                  name: "ringneck",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "deep",
              orderBy: 1,
            },
            {
              id: 205,
              name: "misty",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "moustache",
                },
                // {
                //   name: "fischeri",
                // },
                {
                  name: "personata",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                // {
                //   name: "roseicollis",
                // },
                {
                  name: "taranta",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "misty",
              orderBy: 1,
            },
             {
               id: 206,
               name: "khaki",
               species: [
                 {
                   name: "ringneck",
                 },
                 {
                  name: "plumhead",
                },
                {
                  name: "alexandrine",
                },
               ],
               inheritanceMode: "autosomal dominant",
               multiAlleleBase: "khaki",
               orderBy: 1,
             },
             {
               id: 207,
               name: "slaty",
               species: [
            //     {
            //       name: "ringneck",
            //     },
                 {
                   name: "fischeri",
                 },
            //     {
            //       name: "personata",
            //     },
            //     {
            //       name: "lilianae",
            //     },
            //     {
            //       name: "nigrigenis",
            //     },
               ],
               inheritanceMode: "autosomal dominant",
               multiAlleleBase: "slaty",
               orderBy: 1,
             },
            {
              id: 208,
              name: "euwing",
              species: [
                // {
                //   name: "fischeri",
                // },
                {
                  name: "personata",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "euwing",
              orderBy: 1,
            },
            {
              id: 209,
              name: "dom. pied",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "moustache",
                },
                {
                  name: "fischeri",
                },
                {
                  name: "personata",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dom. pied",
              orderBy: 1,
            },
            {
              id: 210,
              name: "spangle",
              species: [
                     {
                       name: "ringneck",
                     },
                {
                  name: "alexandrine",
                },
                //     {
                //       name: "budgie",
                //     },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "spangle",
              orderBy: 1,
            },
            {
              id: 211,
              name: "dom. edged",
              species: [
                {
                  name: "fischeri",
                },
                {
                  name: "personata",
                },
                {
                  name: "nigrigenis",
                },
                {
                  name: "lilianae",
                },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dom. edged",
              orderBy: 1,
            },
            {
              id: 212,
              name: "pale headed",
              species: [
                // {
                //   name: "roseicollis",
                // },
                //{
                //  name: "fischeri",
                //},
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "pale headed",
              orderBy: 1,
            },
            {
              id: 213,
              name: "dom. silver",
              species: [
                {
                  name: "coleiro",
                },
                {
                  name: "cockatiel",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dom. silver",
              orderBy: 1,
            },
            {
              id: 214,
              name: "dom. yellowcheek",
              species: [
                // {
                //   name: "cockatiel",
                // },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "dom. yellowcheek",
              orderBy: 1,
            },
            //{
            //  id: 216,
            //  name: "dom. pied(NL)",
            //  species: [
            //    {
            //      name: "budgie",
            //    },
            //  ],
            //  inheritanceMode: "autosomal dominant",
            //  multiAlleleBase: "dom. pied(NL)",
            //  orderBy: 1,
            //},
            {
              id: 219,
              name: "brownwing",
              species: [
                // {
                //   name: "budgie",
                // },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "brownwing",
              orderBy: 1,
            },
            {
              id: 221,
              name: "blackface",
              species: [
                {
                  name: "platycercus",
                },
                //{
                //  name: "budgie",
                //},
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "blackface",
              orderBy: 1,
            },
            {
              id: 222,
              name: "bronze",
              species: [
                {
                  name: "alexandrine",
                },
                {
                  name: "personata",
                },
              ],
              inheritanceMode: "autosomal dominant",
              multiAlleleBase: "bronze",
              orderBy: 1,
            },
          ],
          open: false,
        },
        {
          name: "codominant",
          ref_mutations: [
            {
              id: 502,
              name: "violet2",
              species: [
                {
                  name: "fischeri",
                },
                {
                  name: "roseicollis",
                },
              ],
              inheritanceMode: "codominant",
              multiAlleleBase: "blue",
              orderBy: 1,
            },
          ],
          open: false,
        },
        {
          name: "heterosomal recessive",
          ref_mutations: [
            //novos 3
            {
              id: 301,
              name: "SLino",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "cockatiel",
                },
                {
                  name: "budgie",
                },
                {
                  name: "platycercus",
                },
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "SLino",
              orderBy: 1,
            },
            {
              id: 450,
              name: "texasclearbody",
              species: [
                  // {
                  //     "name": "budgie"
                  // }
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "texasclearbody",
              orderBy: 1
            },
            {
              id: 303,
              name: "pallid",
              species: [
                {
                  name: "ringneck",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "alexandrine",
                },
                // {
                //   name: "budgie",
                // },
                {
                  name: "canus",
                },
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "SLino",
              orderBy: 3,
            },
            {
              id: 304,
              name: "opaline",
              species: [
                {
                  name: "coleiro",
                },
                {
                  name: "ringneck",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "fischeri",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "cockatiel",
                },
                {
                  name: "budgie",
                },
                {
                  name: "platycercus",
                },
                {
                  name: "pyrrhura_molinae",
                },
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "opaline",
              orderBy: 1,
            },
            {
                id: 452,
                name: "sealed",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "heterosomal recessive",
                multiAlleleBase: "sealed",
                orderBy: 1
            },

            {
                id: 453,
                name: "lace",
                species: [
                    // {
                    //     "name": "budgie"
                    // }
                ],
                inheritanceMode: "heterosomal recessive",
                multiAlleleBase: "lace",
                orderBy: 1
            },

            {
                id: 454,
                name: "cinnamonwings",
                species: [
                    {
                        "name": "budgie"
                    }
                ],
                inheritanceMode: "heterosomal recessive",
                multiAlleleBase: "cinnamonwings",
                orderBy: 1
            },
            {
              id: 306,
              name: "slate",
              species: [
                //{
                //  name: "ringneck",
                //},
                {
                  name: "budgie",
                },
                //{
                //  name: "roseicollis",
                //},
                //{
                //  name: "platycercus",
                //},
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "slate",
              orderBy: 1,
            },
            // {
            //   id: 302,
            //   name: "platinum",
            //   species: [
            //     {
            //       name: "ringneck",
            //     },
            //     {
            //       name: "cockatiel",
            //     },
            //   ],
            //   inheritanceMode: "heterosomal recessive",
            //   multiAlleleBase: "SLino",
            //   orderBy: 2,
            // },
            {
              id: 305,
              name: "cinnamon",
              species: [
                {
                  name: "coleiro",
                },
                {
                  name: "ringneck",
                },
                {
                  name: "alexandrine",
                },
                {
                  name: "plumhead",
                },
                {
                  name: "moustache",
                },
                {
                  name: "roseicollis",
                },
                {
                  name: "cockatiel",
                },
                // {
                //   name: "budgie",
                // },
                {
                  name: "platycercus",
                },
                {
                  name: "pyrrhura_molinae",
                },
                //{
                //  name: "fischeri",
                //},
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "cinnamon",
              orderBy: 1,
            },
            {
              id: 900,
              name: "cinnamon_pastel",
              species: [
                {
                  name: "coleiro",
                },
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "cinnamonwings",
              orderBy: 1,
            },
            {
              id: 307,
              name: "SL yellowcheek",
              species: [
                {
                 name: "coleiro",
                },
                {
                  name: "cockatiel",
                },
                //{
                //  name: "roseicollis",
                //},
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "SL yellowcheek",
              orderBy: 1,
            },
            {
              id: 308,
              name: "pewter",
              species: [
                //{
                //  name: "ringneck",
                //},
                // {
                //   name: "cockatiel",
                // },
              ],
              inheritanceMode: "heterosomal recessive",
              multiAlleleBase: "pewter",
              orderBy: 1,
            },
            //{
            //  id: 401,
            //  name: "SL edged",
            //  species: [
            //    {
            //      name: "ringneck",
            //    },
            //  ],
            //  inheritanceMode: "heterosomal recessive",
            //  multiAlleleBase: "SL edged",
            //  orderBy: 1,
            //},
          ],
          open: false,
        },
      ],
    };

    scope.IsMutationListSupported = function (mutationList, species) {
      var res = 0;
      var tempSpecies = species;

      mutationList.ref_mutations.forEach(function (mutation) {
        mutation.species.forEach(function (speciesToCompare) {
          if (speciesToCompare.name === tempSpecies) {
            res++;
          }
        });
      });

      return res > 0;
    };
  },
]);

app.factory("Mutation", function ($translate) {
  function Mutation(
    id,
    name,
    inheritanceMode,
    multiAlleleBase,
    species,
    orderBy
  ) {
    this.id = id;
    this.name = name;
    this.cultureAwareName = name;
    this.inheritanceMode = inheritanceMode;
    this.multiAlleleBase = multiAlleleBase;
    this.checked = "";
    this.isT1orT2 = false;
    this.species = species;
    this.orderBy = orderBy;
    this.RefreshCulture();
  }

  Mutation.prototype = {
    getID: function () {
      return this.id;
    },

    getName: function () {
      return this.name;
    },

    getCultureAwareName: function () {
      return this.cultureAwareName;
    },

    getInheritanceMode: function () {
      return this.inheritanceMode;
    },

    getMultiAlleleBase: function () {
      return this.multiAlleleBase;
    },

    getIsMultiAllelic: function () {
      return (
        this.getIsMultiAlleleButNotBaseAllele() ||
        this.name === "blue" ||
        this.name === "NSLino" ||
        this.name === "SLino" ||
        this.name === "whiteface" ||
        this.name === "dilute"
      );
    },

    getIsMultiAlleleButNotBaseAllele: function () {
      return this.name !== this.multiAlleleBase;
    },

    getIsMultiAlleleBaseSupportedBySpecies: function (
      speciesToCheck,
      refMutations
    ) {
      var resValue = false;
      var tmpSelf = this;

      refMutations.forEach(function (refMutation) {
        if (refMutation.multiAlleleBase === tmpSelf.name) {
          refMutation.species.forEach(function (speciesToCompare) {
            if (speciesToCompare.name === speciesToCheck) {
              resValue = true;
            }
          });
        }
      });

      return resValue;
    },

    getChecked: function () {
      return this.checked;
    },

    getIsT1OrT2: function () {
      return this.isT1orT2;
    },

    getSpecies: function () {
      return this.species;
    },

    getOrderBy: function () {
      return this.orderBy;
    },

    getIsSpeciesSupported: function (speciesToCheck) {
      var resValue = false;

      this.species.forEach(function (speciesToCompare) {
        if (speciesToCompare.name === speciesToCheck) {
          resValue = true;
        }
      });

      return resValue;
    },

    RefreshCulture: function () {
      //var tmpMutation = this;
      //$translate(tmpMutation.name).then(function(text) {
      //    tmpMutation.cultureAwareName = text;
      //});
      this.cultureAwareName = $translate.instant(this.name);
    },
  };

  Mutation.fromJson = function (json) {
    var obj = JSON.parse(json);
    return new Mutation(
      obj.id,
      obj.name,
      obj.inheritanceMode,
      obj.multiAlleleBase,
      obj.species,
      obj.orderBy
    );
  };

  return Mutation;
});

app.factory("Bird", function (Mutation, Allele) {
  function Bird(gender) {
    this.green = "green";
    this.gender = gender;
    this.mutations = [];

    //add green
    var nMutation = new Mutation(-2000, "green", "wildtype", "green", [], 0);
    nMutation.checked = "color";
    this.mutations.push(nMutation);

    if (gender === "male") {
      nMutation = new Mutation(
        -1000,
        "gender_male",
        "sex_linked",
        "gender_male",
        [],
        0
      );
      nMutation.checked = "DF";
      this.mutations.push(nMutation);
    } else if (gender === "female") {
      nMutation = new Mutation(
        -1000,
        "gender_female",
        "sex_linked",
        "gender_female",
        [],
        0
      );
      nMutation.checked = "SF";
      this.mutations.push(nMutation);
    }

    this.RefreshCulture();
  }

  Bird.prototype = {
    getGreen: function () {
      return this.green;
    },

    getGender: function () {
      return this.gender;
    },

    getMutations: function () {
      return this.mutations;
    },

    getSplitFullName: function () {
      var splitName = "";
      var isBlueSeriesBird = this.getIsBlueSeries();
      var isNSLinoSeriesBird = this.getIsNSLinoSeries();
      var isSLinoSeriesBird = this.getIsSLinoSeries();
      var isDiluteSeriesBird = this.getIsDiluteSeries();

      var tmpBird = this;
      var tmpGender = this.gender;

      var x1Splits = [];
      var x2Splits = [];
      var tmpShouldAddX1Notation = false;
      var tmpShouldAddX2Notation = false;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (mutation.getChecked() === "split") {
            if (
              mutation.getName() === "blue" ||
              mutation.getName() === "turquoise" ||
              mutation.getName() === "aqua" ||
              mutation.getName() === "indigo" ||
              mutation.getName() === "sapphire" ||
              mutation.getName() === "whiteface" ||
              mutation.getName() === "pastelface" ||
              mutation.getName() === "creamface"||
              mutation.getName() === "texasclearbody"||
              mutation.getName() === "yellowface2" ||
              mutation.getName() === "melanicshimmer" ||
              mutation.getName() === "goldface" ||
              mutation.getName() === "easleyclearbody" ||
              mutation.getName() === "whitecap" ||
              mutation.getName() === "greenline" ||
              mutation.getName() === "anthracite"
            ) {
              if (!isBlueSeriesBird) {
                splitName = splitName + " /" + mutation.getCultureAwareName();
                if (!tmpBird.getParBlueButtonCantCrossOver(mutation, null)) {
                  splitName += mutation.getIsT1OrT2() ? " (T1)" : " (T2)";
                }
              }
            } else if (
              mutation.getName() === "NSLino" ||
              mutation.getName() === "bronze fallow" ||
              mutation.getName() === "pastel" ||
              mutation.getName() === "DEC"
            ) {
              if (!isNSLinoSeriesBird) {
                splitName = splitName + " /" + mutation.getCultureAwareName();
              }
            } else if (
              mutation.getName() === "dilute" ||
              mutation.getName() === "clearwing" ||
              mutation.getName() === "greywing"
            ) {
              if (!isDiluteSeriesBird) {
                splitName = splitName + " /" + mutation.getCultureAwareName();
              }
            } else {
              splitName = splitName + " /" + mutation.getCultureAwareName();
            }
          }
        } else if (mutation.getInheritanceMode() === "heterosomal recessive") {
          if (mutation.getChecked() === "split") {
            if (tmpGender === "male") {
              if (
                mutation.getName() === "SLino" ||
                mutation.getName() === "pallid" ||
                mutation.getName() === "platinum"
              ) {
                if (!isSLinoSeriesBird) {
                  mutation.getIsT1OrT2()
                    ? x1Splits.push(mutation)
                    : x2Splits.push(mutation);
                  if (!tmpBird.getSLinoButtonCantCrossOver(mutation, null)) {
                    mutation.getIsT1OrT2()
                      ? (tmpShouldAddX1Notation = true)
                      : (tmpShouldAddX2Notation = true);
                  }
                }
              } else {
                mutation.getIsT1OrT2()
                  ? x1Splits.push(mutation)
                  : x2Splits.push(mutation);
                if (
                  !tmpBird.getOtherSLMutationButtonCantCrossOver(mutation, null)
                ) {
                  mutation.getIsT1OrT2()
                    ? (tmpShouldAddX1Notation = true)
                    : (tmpShouldAddX2Notation = true);
                }
              }
            }
          }
        }
      });

      if (x1Splits.length > 0) {
        var tmpX1SplitName = "";
        x1Splits.forEach(function (mutation) {
          tmpX1SplitName +=
            (tmpX1SplitName !== "" ? "-" : "") + mutation.getCultureAwareName();
        });
        if (tmpX1SplitName !== "")
          splitName +=
            " /" +
            tmpX1SplitName +
            (tmpShouldAddX1Notation &&
              x1Splits.length > 0 &&
              x2Splits.length > 0
              ? "(Z1)"
              : "");
      }

      if (x2Splits.length > 0) {
        var tmpX2SplitName = "";
        x2Splits.forEach(function (mutation) {
          tmpX2SplitName +=
            (tmpX2SplitName !== "" ? "-" : "") + mutation.getCultureAwareName();
        });
        if (tmpX2SplitName !== "")
          splitName +=
            " /" +
            tmpX2SplitName +
            (tmpShouldAddX1Notation &&
              x1Splits.length > 0 &&
              x2Splits.length > 0
              ? "(Z2)"
              : "");
      }

      return splitName.trim();
    },

    getColorFullName: function () {
      var colorName = "";
      var isBlueSeriesBird = this.getIsBlueSeries();
      var isNSLinoSeriesBird = this.getIsNSLinoSeries();
      var isSLinoSeriesBird = this.getIsSLinoSeries();
      var isDiluteSeriesBird = this.getIsDiluteSeries();

      var tmpGreen = this.mutations[0];

      var tmpGender = this.gender;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (mutation.getChecked() === "color") {
            if (
              mutation.getName() !== "blue" &&
              mutation.getName() !== "turquoise" &&
              mutation.getName() !== "aqua" &&
              mutation.getName() !== "indigo" &&
              mutation.getName() !== "sapphire" &&
              mutation.getName() !== "whiteface" &&
              mutation.getName() !== "pastelface" &&
              mutation.getName() !== "creamface" &&
              mutation.getName() !== "NSLino" &&
              mutation.getName() !== "bronze fallow" &&
              mutation.getName() !== "pastel" &&
              mutation.getName() !== "DEC" &&
              mutation.getName() !== "dilute" &&
              mutation.getName() !== "clearwing" &&
              mutation.getName() !== "greywing" &&
              mutation.getName() !== "texasclearbody"&&
              mutation.getName() !== "yellowface2" &&
              mutation.getName() !== "melanicshimmer" &&
              mutation.getName() !== "goldface" &&
              mutation.getName() !== "easleyclearbody" &&
              mutation.getName() !== "whitecap" &&
              mutation.getName() !== "greenline" &&
              mutation.getName() !== "anthracite"
            ) {
              colorName = colorName + " " + mutation.getCultureAwareName();
            }
          }
        } else if (mutation.getInheritanceMode() === "heterosomal recessive") {
          if (mutation.getChecked() === "color") {
            if (
              mutation.getName() !== "SLino" &&
              mutation.getName() !== "pallid" &&
              mutation.getName() !== "platinum"
            ) {
              colorName = colorName + " " + mutation.getCultureAwareName();
            }
          } else if (mutation.getChecked() === "split") {
            if (tmpGender === "female") {
              if (
                mutation.getName() !== "SLino" &&
                mutation.getName() !== "pallid" &&
                mutation.getName() !== "platinum"
              ) {
                colorName = colorName + " " + mutation.getCultureAwareName();
              }
            }
          }
        } else if (mutation.getInheritanceMode() === "autosomal dominant") {
          if (mutation.getChecked() === "DF") {
            // if (mutation.getName() === "dark") {
            //   colorName = colorName + " " + "DD";
            // } else {
            colorName =
              colorName + " " + mutation.getCultureAwareName() + "(df)";
            // }
          } else if (mutation.getChecked() === "SF") {
            // if (mutation.getName() === "dark") {
            //   colorName = colorName + " " + "D";
            // } else {
            colorName =
              colorName + " " + mutation.getCultureAwareName() + "(sf)";
            // }
          }
        }else if (mutation.getInheritanceMode() === "codominant") {
          if (mutation.getChecked() === "DF") {
            // if (mutation.getName() === "dark") {
            //   colorName = colorName + " " + "DD";
            // } else {
            colorName =
              colorName + " " + mutation.getCultureAwareName() + "(df)";
            // }
          } else if (mutation.getChecked() === "SF") {
            // if (mutation.getName() === "dark") {
            //   colorName = colorName + " " + "D";
            // } else {
            colorName =
              colorName + " " + mutation.getCultureAwareName() + "(sf)";
            // }
          }
        }else if (mutation.getInheritanceMode() === "darkening factors") {
          if (mutation.getChecked() === "DF" ) {
            if(mutation.getName() === "onefator"){
              colorName =
              colorName + " " + mutation.getCultureAwareName() + "(d)";
            }else{
              colorName =
              colorName + " " + mutation.getCultureAwareName() + "(dd)";
            }
          } else if (mutation.getChecked() === "SF") {
            if (tmpGender === "male") {
              if(mutation.getName() === "onefator"){
                colorName =
                colorName + " " + mutation.getCultureAwareName() + "(d)";
              }else{
                colorName =
                colorName + " " + mutation.getCultureAwareName() + "(dd)";
              }
            } else if (tmpGender === "female") {
              colorName = colorName + " " + mutation.getCultureAwareName();
            }
          }
        }
      });

      if (isDiluteSeriesBird) {
        colorName += " " + this.getDiluteSeriesName(true);
      }

      if (isNSLinoSeriesBird) {
        colorName += " " + this.getNSLinoSeriesName(true);
      }

      if (isSLinoSeriesBird) {
        colorName += " " + this.getSLinoSeriesName(true);
      }

      if (!isBlueSeriesBird) {
        if (
          //(this.getDiluteSeriesName(false) !== 'dilute') &&
          this.getNSLinoSeriesName(false) !== "NSLino" &&
          this.getSLinoSeriesName(false) !== "SLino"
        ) {
          colorName += " " + tmpGreen.getCultureAwareName(); //' ' + this.getGreen(); //' green';
        } else {
          if (
            //((this.getDiluteSeriesName(false) === 'dilute') &&
            //(this.getDiluteSplitCount() === 1)) ||
            (this.getNSLinoSeriesName(false) === "NSLino" &&
              this.getNSLinoSplitCount() === 1) ||
            (this.getSLinoSeriesName(false) === "SLino" &&
              this.getSLinoSplitCount() === 1)
          ) {
            colorName += " " + tmpGreen.getCultureAwareName(); //' ' + this.getGreen(); //' green';
          }
        }
      } else {
        colorName = colorName + " " + this.getBlueSeriesName(true);
      }

      //var cnSlices = colorName.trim().split(" ");

      //if (
      //  cnSlices.length > 1 &&
      //  cnSlices[cnSlices.length - 1] === tmpGreen.getCultureAwareName()
      //) {
      //  cnSlices.splice(cnSlices.length - 1, 1);
      //  colorName = cnSlices.join(" ");
     // }

      return colorName.trim();
    },

    getIsBlueSeries: function () {
      var parBlueSplitCount = this.getBlueSeriesSplitCount();
      var parBlueColorCount = this.getBlueSeriesColorCount();

      return parBlueSplitCount === 2 || parBlueColorCount === 2;
    },

    getBlueSeriesSplitCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "blue" ||
            mutation.getName() === "turquoise" ||
            mutation.getName() === "aqua" ||
            mutation.getName() === "indigo" ||
            mutation.getName() === "sapphire" ||
            mutation.getName() === "whiteface" ||
            mutation.getName() === "pastelface" ||
            mutation.getName() === "creamface"
            || mutation.getName() === "texasclearbody"||
            mutation.getName() === "yellowface2" ||
            mutation.getName() === "melanicshimmer" ||
            mutation.getName() === "goldface" ||
            mutation.getName() === "easleyclearbody" ||
            mutation.getName() === "whitecap" ||
            mutation.getName() === "greenline" ||
            mutation.getName() === "anthracite"
          ) {
            if (mutation.getChecked() === "split") {
              count = count + 1;
            }
          }
        }
      });

      return count;
    },

    getBlueSeriesColorCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "blue" ||
            mutation.getName() === "turquoise" ||
            mutation.getName() === "aqua" ||
            mutation.getName() === "indigo" ||
            mutation.getName() === "sapphire" ||
            mutation.getName() === "whiteface" ||
            mutation.getName() === "pastelface" ||
            mutation.getName() === "creamface"
            || mutation.getName() === "texasclearbody"||
            mutation.getName() === "yellowface2" ||
            mutation.getName() === "melanicshimmer" ||
            mutation.getName() === "goldface" ||
            mutation.getName() === "easleyclearbody" ||
            mutation.getName() === "whitecap" ||
            mutation.getName() === "greenline" ||
            mutation.getName() === "anthracite"
          ) {
            if (mutation.getChecked() === "color") {
              count = count + 2;
            }
          }
        }
      });

      return count;
    },

    getBlueSeriesName: function (cultureAware) {
      var parBlueName = "";
      var addonT1OrT2 = "";

      var tmpArray = this.mutations.slice();
      tmpArray.sort(function (elem1, elem2) {
        if (elem1.getOrderBy() < elem2.getOrderBy()) return -1;
        else if (elem1.getOrderBy() > elem2.getOrderBy()) return 1;
        else return 0;
      });

      tmpArray.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            (mutation.getName() === "blue" ||
              mutation.getName() === "turquoise" ||
              mutation.getName() === "aqua" ||
              mutation.getName() === "indigo" ||
              mutation.getName() === "sapphire" ||
              mutation.getName() === "whiteface" ||
              mutation.getName() === "pastelface" ||
              mutation.getName() === "creamface"
              || mutation.getName() === "texasclearbody"||
              mutation.getName() === "yellowface2" ||
              mutation.getName() === "melanicshimmer" ||
              mutation.getName() === "goldface" ||
              mutation.getName() === "easleyclearbody" ||
              mutation.getName() === "whitecap" ||
              mutation.getName() === "greenline" ||
              mutation.getName() === "anthracite" ) &&
            (mutation.getChecked() === "color" ||
              mutation.getChecked() === "split")
          ) {
            if (cultureAware) {
              if (mutation.getChecked() === "color")
                parBlueName = mutation.getCultureAwareName() + parBlueName;
              else if (mutation.getChecked() === "split") {
                parBlueName =
                  mutation.getCultureAwareName().charAt(0).toUpperCase() +
                  mutation.getCultureAwareName().slice(1).toLowerCase() +
                  parBlueName;
                addonT1OrT2 =
                  (addonT1OrT2 !== "" ? "/" : "") +
                  addonT1OrT2;
              }
            } else {
              if (mutation.getChecked() === "color")
                parBlueName = mutation.getName() + parBlueName;
              else if (mutation.getChecked() === "split") {
                parBlueName =
                  mutation.getName().charAt(0).toUpperCase() +
                  mutation.getName().slice(1).toLowerCase() +
                  parBlueName;
                addonT1OrT2 =
                  (addonT1OrT2 !== "" ? "/" : "") +
                  addonT1OrT2;
              }
            }
          }
        }
      });

      var darkIsEF = false;
      var darkIndex = this.mutations
        .map(function (mutation) {
          return mutation.getName();
        })
        .indexOf("dark");
      if (darkIndex > -1) darkIsEF = this.getIsEF(this.mutations[darkIndex]);

      return (
        parBlueName +
        (darkIsEF && addonT1OrT2 !== "" ? " (" + addonT1OrT2 + ")" : "")
      );
    },

    getMutationFullName: function () {
      return (this.getColorFullName() + " " + this.getSplitFullName()); //.replace("Verde /", "");
    },

    getIndexOfMutation: function (mutationToCheck) {
      var indexOf = -1;

      this.mutations.forEach(function (mutation, index) {
        if (mutation.name === mutationToCheck.name) {
          indexOf = index;
        }
      });

      if (indexOf === -1) {
        var newMutation = new Mutation(
          mutationToCheck.id,
          mutationToCheck.name,
          mutationToCheck.inheritanceMode,
          mutationToCheck.multiAlleleBase,
          mutationToCheck.species,
          mutationToCheck.orderBy
        );
        indexOf = this.mutations.push(newMutation) - 1;
        this.mutations.sort(function (item1, item2) {
          return item1.id - item2.id;
        });
        this.mutations.forEach(function (mutation, index) {
          if (mutation.name === mutationToCheck.name) {
            indexOf = index;
          }
        });
      }

      return indexOf;
    },

    getMutationByMutationName: function (mutationName) {
      var res = null;

      this.mutations.forEach(function (mutation) {
        if (mutation.getName() === mutationName) {
          res = mutation;
        }
      });

      return res;
    },

    getIsParBlueButtonDisabled: function (
      btn_ref_mutation,
      btn_state,
      species
    ) {
      var res = true;

      if (btn_ref_mutation.getIsSpeciesSupported(species)) {
        var isBlueSeriesBird = this.getIsBlueSeries();
        var blueSeriesNameBird = this.getBlueSeriesName(false);

        // blue series bird
        if (isBlueSeriesBird) {
          // color for blue, turq, aqua, indigo, sapphire
          if (this.getBlueSeriesSplitCount() === 0) {
            if (blueSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            }
          } else if (this.getBlueSeriesSplitCount() === 2) {
            if (
              (blueSeriesNameBird.indexOf(btn_ref_mutation.name) > -1 ||
                blueSeriesNameBird.indexOf(
                  btn_ref_mutation.name.charAt(0).toUpperCase() +
                  btn_ref_mutation.name.slice(1).toLowerCase()
                ) > -1) &&
              btn_state === "split"
            ) {
              res = false;
            }
          }
        } else {
          if (this.getBlueSeriesSplitCount() === 0) {
            res = false;
          } else if (this.getBlueSeriesSplitCount() === 1) {
            if (blueSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            } else {
              if (btn_state === "split") {
                res = false;
              }
            }
          }
        }
      }

      return res;
    },

    checkParBlueCrossOverButtonStates: function (btn_ref_mutation, species) {
      var tmpBird = this;

      if (btn_ref_mutation.getIsSpeciesSupported(species)) {
        this.mutations.forEach(function (mutation) {
          if (
            mutation.getName() !== btn_ref_mutation.name &&
            tmpBird.getIsUsed(mutation) &&
            mutation.getChecked() === "split" &&
            (mutation.getName() === "blue" ||
              mutation.getName() === "turquoise" ||
              mutation.getName() === "aqua" ||
              mutation.getName() === "indigo" ||
              mutation.getName() === "sapphire" ||
              mutation.getName() === "whiteface" ||
              mutation.getName() === "pastelface" ||
              mutation.getName() === "creamface"
              || mutation.getName() === "texasclearbody"||
              mutation.getName() === "yellowface2" ||
              mutation.getName() === "melanicshimmer" ||
              mutation.getName() === "goldface" ||
              mutation.getName() === "easleyclearbody" ||
              mutation.getName() === "whitecap" ||
              mutation.getName() === "greenline" ||
              mutation.getName() === "anthracite")
          ) {
            mutation.isT1orT2 = !btn_ref_mutation.getIsT1OrT2();
          }
        });
      }
    },

    getParBlueButtonCantCrossOver: function (btn_ref_mutation, species) {
      var res = true;
      var tmpBird = this;

      if (species === null || btn_ref_mutation.getIsSpeciesSupported(species)) {
        var darkFoundAndSF = false;
        var btnRefMutationFoundAndSplit = false;

        this.mutations.forEach(function (mutation) {
          if (
            mutation.getName() === "dark" &&
            tmpBird.getIsUsed(mutation) &&
            mutation.getChecked() === "SF"
          ) {
            darkFoundAndSF = true;
          } else if (
            mutation.getName() === btn_ref_mutation.name &&
            mutation.getChecked() === "split"
          ) {
            btnRefMutationFoundAndSplit = true;
          }
        });

        if (
          darkFoundAndSF &&
          btnRefMutationFoundAndSplit &&
          this.getBlueSeriesSplitCount() > 0 &&
          this.getBlueSeriesSplitCount() < 3
        ) {
          res = false;
        }
      }

      return res;
    },

    checkSLinoCrossOverButtonStates: function (btn_ref_mutation, species) {
      var tmpBird = this;

      if (btn_ref_mutation.getIsSpeciesSupported(species)) {
        this.mutations.forEach(function (mutation) {
          if (
            mutation.getName() !== btn_ref_mutation.name &&
            tmpBird.getIsUsed(mutation) &&
            mutation.getChecked() === "split" &&
            (mutation.getName() === "SLino" ||
              mutation.getName() === "pallid" ||
              mutation.getName() === "platinum")
          ) {
            mutation.isT1orT2 = !btn_ref_mutation.getIsT1OrT2();
          }
        });
      }
    },

    getSLinoButtonCantCrossOver: function (btn_ref_mutation, species) {
      var res = true;
      var tmpBird = this;

      if (species === null || btn_ref_mutation.getIsSpeciesSupported(species)) {
        var otherSLMutationFoundAndSplit = false;
        var btnRefMutationFoundAndSplit = false;

        this.mutations.forEach(function (mutation) {
          if (
            (mutation.getName() === "opaline" ||
              mutation.getName() === "slate" ||
              mutation.getName() === "cinnamon") &&
            tmpBird.getIsUsed(mutation) &&
            mutation.getChecked() === "split"
          ) {
            otherSLMutationFoundAndSplit = true;
          } else if (
            mutation.getName() === btn_ref_mutation.name &&
            mutation.getChecked() === "split"
          ) {
            btnRefMutationFoundAndSplit = true;
          }
        });

        if (
          otherSLMutationFoundAndSplit &&
          btnRefMutationFoundAndSplit &&
          this.getSLinoSplitCount() > 0 &&
          this.getSLinoSplitCount() < 3
        ) {
          res = false;
        }
      }

      return res;
    },

    getOtherSLMutationButtonCantCrossOver: function (
      btn_ref_mutation,
      species
    ) {
      var res = true;
      var tmpBird = this;

      if (species === null || btn_ref_mutation.getIsSpeciesSupported(species)) {
        var otherSLMutationFoundAndSplit = false;
        var btnRefMutationFoundAndSplit = false;

        this.mutations.forEach(function (mutation) {
          if (btn_ref_mutation.getName() === "slate") {
            if (
              (mutation.getName() === "SLino" ||
                mutation.getName() === "pallid" ||
                mutation.getName() === "platinum" ||
                mutation.getName() === "opaline" ||
                mutation.getName() === "cinnamon") &&
              tmpBird.getIsUsed(mutation) &&
              mutation.getChecked() === "split"
            ) {
              otherSLMutationFoundAndSplit = true;
            }
          } else if (btn_ref_mutation.getName() === "opaline") {
            if (
              (mutation.getName() === "SLino" ||
                mutation.getName() === "pallid" ||
                mutation.getName() === "platinum" ||
                mutation.getName() === "slate" ||
                mutation.getName() === "cinnamon") &&
              tmpBird.getIsUsed(mutation) &&
              mutation.getChecked() === "split"
            ) {
              otherSLMutationFoundAndSplit = true;
            }
          } else if (btn_ref_mutation.getName() === "cinnamon") {
            if (
              (mutation.getName() === "SLino" ||
                mutation.getName() === "pallid" ||
                mutation.getName() === "platinum" ||
                mutation.getName() === "opaline" ||
                mutation.getName() === "slate") &&
              tmpBird.getIsUsed(mutation) &&
              mutation.getChecked() === "split"
            ) {
              otherSLMutationFoundAndSplit = true;
            }
          }

          if (
            mutation.getName() === btn_ref_mutation.name &&
            mutation.getChecked() === "split"
          ) {
            btnRefMutationFoundAndSplit = true;
          }
        });

        if (otherSLMutationFoundAndSplit && btnRefMutationFoundAndSplit) {
          res = false;
        }
      }

      return res;
    },

    getDiluteSplitCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "dilute" ||
            mutation.getName() === "clearwing" ||
            mutation.getName() === "greywing"
          ) {
            if (mutation.getChecked() === "split") {
              count = count + 1;
            }
          }
        }
      });

      return count;
    },

    getDiluteColorCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "dilute" ||
            mutation.getName() === "clearwing" ||
            mutation.getName() === "greywing"
          ) {
            if (mutation.getChecked() === "color") {
              count = count + 2;
            }
          }
        }
      });

      return count;
    },

    getIsDiluteSeries: function () {
      var DiluteSplitCount = this.getDiluteSplitCount();
      var DiluteColorCount = this.getDiluteColorCount();

      if (DiluteSplitCount === 2 || DiluteColorCount === 2) {
        return true;
      } else {
        return false;
      }
    },

    getDiluteSeriesName: function (cultureAware) {
      var DiluteName = "";

      var tmpArray = this.mutations.slice();
      tmpArray.sort(function (elem1, elem2) {
        if (elem1.getOrderBy() < elem2.getOrderBy()) return -1;
        else if (elem1.getOrderBy() > elem2.getOrderBy()) return 1;
        else return 0;
      });

      tmpArray.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            (mutation.getName() === "dilute" ||
              mutation.getName() === "clearwing" ||
              mutation.getName() === "greywing") &&
            (mutation.getChecked() === "color" ||
              mutation.getChecked() === "split")
          ) {
            if (cultureAware) {
              if (mutation.getChecked() === "color")
                DiluteName = mutation.getCultureAwareName() + DiluteName;
              else if (mutation.getChecked() === "split")
                DiluteName =
                  mutation.getCultureAwareName().charAt(0).toUpperCase() +
                  mutation.getCultureAwareName().slice(1).toLowerCase() +
                  DiluteName;
            } else {
              if (mutation.getChecked() === "color")
                DiluteName = mutation.getName() + DiluteName;
              else if (mutation.getChecked() === "split")
                DiluteName =
                  mutation.getName().charAt(0).toUpperCase() +
                  mutation.getName().slice(1).toLowerCase() +
                  DiluteName;
            }

            /*
                            if (cultureAware)
                                DiluteName = mutation.getCultureAwareName() + DiluteName.charAt(0).toUpperCase() + DiluteName.slice(1).toLowerCase();
                            else
                                DiluteName = mutation.getName() + DiluteName.charAt(0).toUpperCase() + DiluteName.slice(1).toLowerCase();
                            */
          }
        }
      });

      return DiluteName;
    },

    getIsDiluteButtonDisabled: function (btn_ref_mutation, btn_state, species) {
      var res = true;

      if (btn_ref_mutation.getIsSpeciesSupported(species)) {
        var isDiluteSeriesBird = this.getIsDiluteSeries();
        var DiluteSeriesNameBird = this.getDiluteSeriesName(false);

        // Dilute series bird
        if (isDiluteSeriesBird) {
          // color for Dilute, bronze fallow, pastel, DEC
          if (this.getDiluteSplitCount() === 0) {
            if (DiluteSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            }
          } else if (this.getDiluteSplitCount() === 2) {
            if (
              (DiluteSeriesNameBird.indexOf(btn_ref_mutation.name) > -1 ||
                DiluteSeriesNameBird.indexOf(
                  btn_ref_mutation.name.charAt(0).toUpperCase() +
                  btn_ref_mutation.name.slice(1).toLowerCase()
                ) > -1) &&
              btn_state === "split"
            ) {
              res = false;
            }
          }
        } else {
          if (this.getDiluteSplitCount() === 0) {
            res = false;
          } else if (this.getDiluteSplitCount() === 1) {
            if (DiluteSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            } else {
              if (btn_state === "split") {
                res = false;
              }
            }
          }
        }
      }

      return res;
    },

    getNSLinoSplitCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "NSLino" ||
            mutation.getName() === "bronze fallow" ||
            mutation.getName() === "pastel" ||
            mutation.getName() === "DEC"
          ) {
            if (mutation.getChecked() === "split") {
              count = count + 1;
            }
          }
        }
      });

      return count;
    },

    getNSLinoColorCount: function () {
      var count = 0;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            mutation.getName() === "NSLino" ||
            mutation.getName() === "bronze fallow" ||
            mutation.getName() === "pastel" ||
            mutation.getName() === "DEC"
          ) {
            if (mutation.getChecked() === "color") {
              count = count + 2;
            }
          }
        }
      });

      return count;
    },

    getIsNSLinoSeries: function () {
      var nslinoSplitCount = this.getNSLinoSplitCount();
      var nslinoColorCount = this.getNSLinoColorCount();

      if (nslinoSplitCount === 2 || nslinoColorCount === 2) {
        return true;
      } else {
        return false;
      }
    },

    getNSLinoSeriesName: function (cultureAware) {
      var nslinoName = "";

      var tmpArray = this.mutations.slice();
      tmpArray.sort(function (elem1, elem2) {
        if (elem1.getOrderBy() < elem2.getOrderBy()) return -1;
        else if (elem1.getOrderBy() > elem2.getOrderBy()) return 1;
        else return 0;
      });

      tmpArray.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "autosomal recessive") {
          if (
            (mutation.getName() === "NSLino" ||
              mutation.getName() === "bronze fallow" ||
              mutation.getName() === "pastel" ||
              mutation.getName() === "DEC") &&
            (mutation.getChecked() === "color" ||
              mutation.getChecked() === "split")
          ) {
            if (
              mutation.getName() !== "NSLino" &&
              mutation.getName() !== "DEC"
            ) {
              if (cultureAware) {
                if (mutation.getChecked() === "color")
                  nslinoName = mutation.getCultureAwareName() + nslinoName;
                else if (mutation.getChecked() === "split")
                  nslinoName =
                    mutation.getCultureAwareName().charAt(0).toUpperCase() +
                    mutation.getCultureAwareName().slice(1).toLowerCase() +
                    nslinoName;
              } else {
                if (mutation.getChecked() === "color")
                  nslinoName = mutation.getName() + nslinoName;
                else if (mutation.getChecked() === "split")
                  nslinoName =
                    mutation.getName().charAt(0).toUpperCase() +
                    mutation.getName().slice(1).toLowerCase() +
                    nslinoName;
              }

              /*
                                if (cultureAware)
                                    nslinoName = mutation.getCultureAwareName() + nslinoName.charAt(0).toUpperCase() + nslinoName.slice(1).toLowerCase();
                                else
                                    nslinoName = mutation.getName() + nslinoName.charAt(0).toUpperCase() + nslinoName.slice(1).toLowerCase();
                                */
            } else {
              if (cultureAware)
                nslinoName = mutation.getCultureAwareName() + nslinoName;
              else nslinoName = mutation.getName() + nslinoName;
            }
          }
        }
      });

      return nslinoName;
    },

    getIsNSLinoButtonDisabled: function (btn_ref_mutation, btn_state, species) {
      var res = true;

      if (btn_ref_mutation.getIsSpeciesSupported(species)) {
        var isNSLinoSeriesBird = this.getIsNSLinoSeries();
        var nslinoSeriesNameBird = this.getNSLinoSeriesName(false);

        // NSLino series bird
        if (isNSLinoSeriesBird) {
          // color for NSLino, bronze fallow, pastel, DEC
          if (this.getNSLinoSplitCount() === 0) {
            if (nslinoSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            }
          } else if (this.getNSLinoSplitCount() === 2) {
            if (
              (nslinoSeriesNameBird.indexOf(btn_ref_mutation.name) > -1 ||
                nslinoSeriesNameBird.indexOf(
                  btn_ref_mutation.name.charAt(0).toUpperCase() +
                  btn_ref_mutation.name.slice(1).toLowerCase()
                ) > -1) &&
              btn_state === "split"
            ) {
              res = false;
            }
          }
        } else {
          if (this.getNSLinoSplitCount() === 0) {
            res = false;
          } else if (this.getNSLinoSplitCount() === 1) {
            if (nslinoSeriesNameBird === btn_ref_mutation.name) {
              res = false;
            } else {
              if (btn_state === "split") {
                res = false;
              }
            }
          }
        }
      }

      return res;
    },

    getSLinoSplitCount: function () {
      var count = 0;

      var tmpGender = this.gender;

      this.mutations.forEach(function (mutation) {
        if (tmpGender === "male") {
          if (mutation.getInheritanceMode() === "heterosomal recessive") {
            if (
              mutation.getName() === "SLino" ||
              mutation.getName() === "pallid" ||
              mutation.getName() === "platinum"
            ) {
              if (mutation.getChecked() === "split") {
                count = count + 1;
              }
            }
          }
        }
      });

      return count;
    },

    getSLinoColorCount: function () {
      var count = 0;

      var tmpGender = this.gender;

      this.mutations.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "heterosomal recessive") {
          if (
            mutation.getName() === "SLino" ||
            mutation.getName() === "pallid" ||
            mutation.getName() === "platinum"
          ) {
            if (tmpGender === "male") {
              if (mutation.getChecked() === "color") {
                count = count + 2;
              }
            } else if (tmpGender === "female") {
              if (mutation.getChecked() === "split") {
                count = count + 2;
              }
            }
          }
        }
      });

      return count;
    },

    getIsSLinoSeries: function () {
      var slinoSplitCount = this.getSLinoSplitCount();
      var slinoColorCount = this.getSLinoColorCount();

      if (slinoSplitCount === 2 || slinoColorCount === 2) {
        return true;
      } else {
        return false;
      }
    },

    getSLinoSeriesName: function (cultureAware) {
      var slinoName = "";

      var tmpArray = this.mutations.slice();
      tmpArray.sort(function (elem1, elem2) {
        if (elem1.getOrderBy() < elem2.getOrderBy()) return -1;
        else if (elem1.getOrderBy() > elem2.getOrderBy()) return 1;
        else return 0;
      });

      tmpArray.forEach(function (mutation) {
        if (mutation.getInheritanceMode() === "heterosomal recessive") {
          if (
            (mutation.getName() === "SLino" ||
              mutation.getName() === "pallid" ||
              mutation.getName() === "platinum") &&
            (mutation.getChecked() === "color" ||
              mutation.getChecked() === "split")
          ) {
            if (mutation.getName() !== "SLino") {
              if (cultureAware) {
                if (mutation.getChecked() === "color")
                  slinoName = mutation.getCultureAwareName() + slinoName;
                else if (mutation.getChecked() === "split")
                  slinoName =
                    mutation.getCultureAwareName().charAt(0).toUpperCase() +
                    mutation.getCultureAwareName().slice(1).toLowerCase() +
                    slinoName;
              } else {
                if (mutation.getChecked() === "color")
                  slinoName = mutation.getName() + slinoName;
                else if (mutation.getChecked() === "split")
                  slinoName =
                    mutation.getName().charAt(0).toUpperCase() +
                    mutation.getName().slice(1).toLowerCase() +
                    slinoName;
              }

              /*
                                if (cultureAware)
                                    slinoName = mutation.getCultureAwareName() + slinoName.charAt(0).toUpperCase() + slinoName.slice(1).toLowerCase();
                                else
                                    slinoName = mutation.getName() + slinoName.charAt(0).toUpperCase() + slinoName.slice(1).toLowerCase();
                                */
            } else {
              if (cultureAware)
                slinoName = mutation.getCultureAwareName() + slinoName;
              else slinoName = mutation.getName() + slinoName;
            }
          }
        }
      });

      return slinoName;
    },

    getIsSLinoButtonDisabled: function (btn_ref_mutation, btn_state) {
      var res = true;

      var isSLinoSeriesBird = this.getIsSLinoSeries();
      var slinoSeriesNameBird = this.getSLinoSeriesName(false);

      // SLino series bird
      if (isSLinoSeriesBird) {
        // color for SLino, pallid, platinum
        if (this.getSLinoSplitCount() === 0) {
          if (slinoSeriesNameBird === btn_ref_mutation.name) {
            res = false;
          }
        } else if (this.getSLinoSplitCount() === 2) {
          if (
            (slinoSeriesNameBird.indexOf(btn_ref_mutation.name) > -1 ||
              slinoSeriesNameBird.indexOf(
                btn_ref_mutation.name.charAt(0).toUpperCase() +
                btn_ref_mutation.name.slice(1).toLowerCase()
              ) > -1) &&
            btn_state === "split"
          ) {
            res = false;
          }
        }
      } else {
        if (this.getSLinoSplitCount() === 0) {
          res = false;
        } else if (this.getSLinoSplitCount() === 1) {
          if (slinoSeriesNameBird === btn_ref_mutation.name) {
            res = false;
          } else {
            if (btn_state === "split") {
              res = false;
            }
          }
        }
      }

      return res;
    },

    getIsEF: function (mutationToCheck) {
      var res = false;

      if (
        mutationToCheck.getInheritanceMode() === "autosomal dominant" ||
        (mutationToCheck.getInheritanceMode() === "darkening factors" &&
          this.getGender() === "male")
      ) {
        res = mutationToCheck.getChecked() === "SF";
      }

      return res;
    },

    getIsSplit: function (mutationToCheck) {
      var res = false;

      if (
        mutationToCheck.getInheritanceMode() === "autosomal recessive" ||
        (mutationToCheck.getInheritanceMode() === "heterosomal recessive" &&
          this.getGender() === "male")
      ) {
        res = mutationToCheck.getChecked() === "split";
      }

      return res;
    },

    getIsSplitOrEF: function (mutationToCheck) {
      return this.getIsSplit(mutationToCheck) || this.getIsEF(mutationToCheck);
    },

    getIsDF: function (mutationToCheck) {
      var res = false;

      if (
        mutationToCheck.getInheritanceMode() === "autosomal dominant" ||
        mutationToCheck.getInheritanceMode() === "darkening factors"
      ) {
        if (mutationToCheck.getInheritanceMode() === "darkening factors") {
          if (this.getGender() === "male") {
            res = mutationToCheck.getChecked() === "DF";
          } else if (this.getGender() === "female") {
            res = mutationToCheck.getChecked() === "SF";
          }
        } else {
          res = mutationToCheck.getChecked() === "DF";
        }
      }

      return res;
    },

    getIsColor: function (mutationToCheck) {
      var res = false;

      if (
        mutationToCheck.getInheritanceMode() === "autosomal recessive" ||
        mutationToCheck.getInheritanceMode() === "heterosomal recessive"
      ) {
        if (mutationToCheck.getInheritanceMode() === "heterosomal recessive") {
          if (this.getGender() === "male") {
            res = mutationToCheck.getChecked() === "color";
          } else if (this.getGender() === "female") {
            res = mutationToCheck.getChecked() === "split";
          }
        } else {
          res = mutationToCheck.getChecked() === "color";
        }
      }

      return res;
    },

    getIsColorOrDF: function (mutationToCheck) {
      return this.getIsColor(mutationToCheck) || this.getIsDF(mutationToCheck);
    },

    getIsUsed: function (mutationToCheck) {
      var res =
        mutationToCheck.getName() === "gender_male" ||
        mutationToCheck.getName() === "gender_female";

      if (mutationToCheck.getName() === "green") {
        return false;
      }

      res =
        res ||
        mutationToCheck.getChecked() === "split" ||
        mutationToCheck.getChecked() === "SF" ||
        mutationToCheck.getChecked() === "color" ||
        mutationToCheck.getChecked() === "DF";

      return res;
    },

    getSplitOrEFCount: function (multiAllelicCounts) {
      var res = 0;
      var tmpBird = this;

      this.mutations.forEach(function (mutation) {
        if (
          tmpBird.getIsEF(mutation) ||
          tmpBird.getIsSplit(mutation) ||
          mutation.getName() === "gender_female"
        ) {
          //|| ((tmpBird.getGender() === 'female') && (mutation.getName() === 'SLino') && (mutation.getChecked() === 'split'))) {
          if (tmpBird.getIsEF(mutation)) {
            res += 1;
          } else {
            //if ((mutation.getIsMultiAllelic()) && (mutation.getName() !== mutation.getMultiAlleleBase())) {
            if (mutation.getIsMultiAllelic()) {
              if (
                !multiAllelicCounts.hasOwnProperty(
                  mutation.getMultiAlleleBase()
                )
              )
                multiAllelicCounts[mutation.getMultiAlleleBase()] = 1;
              else multiAllelicCounts[mutation.getMultiAlleleBase()] += 1;
            } else if (!mutation.getIsMultiAllelic()) {
              res += 1;
            }
          }
        }
      });

      for (var key in multiAllelicCounts) {
        res++;
      }

      return res;
    },

    isFittingChromatids: function (alleleList) {
      var leftChromatidFits = true;
      var rightChromatidFits = true;
      var tmpBird = this;
      var leftChromatid = [];
      var rightChromatid = [];

      this.getMutations().forEach(function (mutation) {
        if (tmpBird.getIsColorOrDF(mutation)) {
          leftChromatid.push(Allele.fromMutationAndMutated(mutation, true));
          rightChromatid.push(Allele.fromMutationAndMutated(mutation, true));
        } else if (tmpBird.getIsSplitOrEF(mutation)) {
          if (
            mutation.getMultiAlleleBase() === "blue" ||
            mutation.getMultiAlleleBase() === "whiteface" ||
            mutation.getMultiAlleleBase() === "SLino" ||
            mutation.getMultiAlleleBase() === "opaline" ||
            mutation.getMultiAlleleBase() === "cinnamon" ||
            mutation.getMultiAlleleBase() === "slate"
          ) {
            if (mutation.getIsT1OrT2()) {
              leftChromatid.push(Allele.fromMutationAndMutated(mutation, true));
              rightChromatid.push(
                Allele.fromMutationAndMutated(mutation, false)
              );
            } else {
              leftChromatid.push(
                Allele.fromMutationAndMutated(mutation, false)
              );
              rightChromatid.push(
                Allele.fromMutationAndMutated(mutation, true)
              );
            }
          } else {
            leftChromatid.push(Allele.fromMutationAndMutated(mutation, true));
            rightChromatid.push(Allele.fromMutationAndMutated(mutation, false));
          }
        }
      });

      alleleList.forEach(function (allele) {
        if (allele) {
          var alleleIndex = leftChromatid
            .map(function (chromatidAllele) {
              return chromatidAllele.getMutation().getName();
            })
            .indexOf(allele.getMutation().getName());
          leftChromatidFits &=
            alleleIndex > -1 &&
            leftChromatid[alleleIndex].getMutated() === allele.getMutated();

          alleleIndex = rightChromatid
            .map(function (chromatidAllele) {
              return chromatidAllele.getMutation().getName();
            })
            .indexOf(allele.getMutation().getName());
          rightChromatidFits &=
            alleleIndex > -1 &&
            rightChromatid[alleleIndex].getMutated() === allele.getMutated();
        }
      });

      return leftChromatidFits || rightChromatidFits;
    },

    detemineT1OrT2State: function (alleleList) {
      function findAlleleByMutationsName(alleleList, mutationName) {
        var res = null;

        for (var i = 0; i < alleleList.length; i++) {
          var allele = alleleList[i];
          if (allele.getMutation().getName() === mutationName) {
            res = allele;
            break;
          }
        }

        return res;
      }

      var darkAllele = findAlleleByMutationsName(alleleList, "dark");

      if (
        darkAllele &&
        darkAllele.getMutated() &&
        this.getIsEF(
          this.getMutationByMutationName(darkAllele.getMutation().getName())
        )
      ) {
        var parblueAllele = findAlleleByMutationsName(alleleList, "blue");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }
        /* if ((parblueAllele) &&
                        (parblueAllele.getMutated()) &&
                        (this.getIsSplit(this.getMutationByMutationName(parblueAllele.getMutation().getName())))) {
                        parblueAllele.isT1orT2 = true;
                    } */

        parblueAllele = findAlleleByMutationsName(alleleList, "turquoise");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "aqua");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "indigo");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "sapphire");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "whiteface");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "pastelface");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }

        parblueAllele = findAlleleByMutationsName(alleleList, "creamface");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }
        parblueAllele = findAlleleByMutationsName(alleleList, "texasclearbody");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }
        parblueAllele = findAlleleByMutationsName(alleleList, "yellowface2");
        if (parblueAllele && parblueAllele.getMutated()) {
          parblueAllele.isT1orT2 = true;
        }
        parblueAllele = findAlleleByMutationsName(alleleList, "melanicshimmer");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
        parblueAllele = findAlleleByMutationsName(alleleList, "goldface");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
        parblueAllele = findAlleleByMutationsName(alleleList, "easleyclearbody");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
        parblueAllele = findAlleleByMutationsName(alleleList, "whitecap");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
        parblueAllele = findAlleleByMutationsName(alleleList, "greenline");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
        parblueAllele = findAlleleByMutationsName(alleleList, "anthracite");
                if (parblueAllele && parblueAllele.getMutated()) {
                  parblueAllele.isT1orT2 = true;
                }
      }
    },

    getOffspringFactor: function (alleleList) {
      var res =
        this.getSexChromosomeOffspringFactor(alleleList) *
        this.getDarkBlueChromosomeOffspringFactor(alleleList);

      for (var i = 0; i < alleleList.length; i++) {
        var allele = alleleList[i];
        if (
          allele.getMutation().getName() !== "gender_male" &&
          allele.getMutation().getName() !== "gender_female" &&
          allele.getMutation().getInheritanceMode() !==
          "heterosomal recessive" &&
          allele.getMutation().getName() !== "dark" &&
          allele.getMutation().getName() !== "blue" &&
          allele.getMutation().getName() !== "turquoise" &&
          allele.getMutation().getName() !== "aqua" &&
          allele.getMutation().getName() !== "indigo" &&
          allele.getMutation().getName() !== "sapphire" &&
          allele.getMutation().getName() !== "whiteface" &&
          allele.getMutation().getName() !== "pastelface" &&
          allele.getMutation().getName() !== "creamface" &&
          allele.getMutation().getName() !== "texasclearbody" &&
          allele.getMutation().getName() !== "yellowface2" &&
          allele.getMutation().getName() !== "melanicshimmer" &&
          allele.getMutation().getName() !== "goldface" &&
          allele.getMutation().getName() !== "easleyclearbody" &&
          allele.getMutation().getName() !== "whitecap" &&
          allele.getMutation().getName() !== "greenline" &&
          allele.getMutation().getName() !== "anthracite"
        ) {
          if (
            this.getIsSplitOrEF(
              this.getMutationByMutationName(allele.getMutation().getName())
            )
          ) {
            res *= 0.5;
          }
        }
      }

      return res;
    },

    getSexChromosomeOffspringFactor: function (alleleList) {
      var res = 1.0;
      var i;
      var slateFound,
        cinnamonFound,
        SLinoFound,
        pallidFound,
        platinumFound,
        opalineFound = false;
      var slateAllele,
        cinnamonAllele,
        SLinoAllele,
        pallidAllele,
        platinumAllele,
        opalineAllele = null;
      var splitCount = 0;

      for (i = 0; i < alleleList.length; i++) {
        var allele = alleleList[i];
        if (
          allele.getMutation().getName() !== "gender_male" &&
          allele.getMutation().getName() !== "gender_female" &&
          allele.getMutation().getInheritanceMode() === "heterosomal recessive"
        ) {
          if (
            this.getIsSplit(
              this.getMutationByMutationName(allele.getMutation().getName())
            )
          ) {
            if (allele.getMutation().getName() === "SLino") {
              SLinoFound = true;
              SLinoAllele = allele;
              splitCount++;
            } else if (allele.getMutation().getName() === "pallid") {
              pallidFound = true;
              pallidAllele = allele;
              splitCount++;
            } else if (allele.getMutation().getName() === "platinum") {
              platinumFound = true;
              platinumAllele = allele;
              splitCount++;
            } else if (allele.getMutation().getName() === "opaline") {
              opalineFound = true;
              opalineAllele = allele;
              splitCount++;
            } else if (allele.getMutation().getName() === "cinnamon") {
              cinnamonFound = true;
              cinnamonAllele = allele;
              splitCount++;
            } else if (allele.getMutation().getName() === "slate") {
              slateFound = true;
              slateAllele = allele;
              splitCount++;
            }
          }
        }
      }

      if (splitCount > 0) {
        if (splitCount === 1) {
          res *= 0.5;
        } else {
          if (slateFound && cinnamonFound) {
            if (this.isFittingChromatids([slateAllele, cinnamonAllele])) {
              res *= 0.93;
            } else {
              res *= 0.07;
            }
          } else if (
            slateFound &&
            (SLinoFound || pallidFound || platinumFound)
          ) {
            if (
              this.isFittingChromatids([
                slateAllele,
                SLinoAllele,
                pallidAllele,
                platinumAllele,
              ])
            ) {
              res *= 0.9;
            } else {
              res *= 0.1;
            }
          } else if (slateFound && opalineFound) {
            if (this.isFittingChromatids([slateAllele, opalineAllele])) {
              res *= 0.6;
            } else {
              res *= 0.4;
            }
          }

          if (cinnamonFound && (SLinoFound || pallidFound || platinumFound)) {
            if (
              this.isFittingChromatids([
                cinnamonAllele,
                SLinoAllele,
                pallidAllele,
                platinumAllele,
              ])
            ) {
              res *= 0.97;
            } else {
              res *= 0.03;
            }
          } else if (cinnamonFound && opalineFound) {
            if (this.isFittingChromatids([cinnamonAllele, opalineAllele])) {
              res *= 0.67;
            } else {
              res *= 0.33;
            }
          }

          if ((SLinoFound || pallidFound || platinumFound) && opalineFound) {
            if (
              this.isFittingChromatids([
                SLinoAllele,
                pallidAllele,
                platinumAllele,
                opalineAllele,
              ])
            ) {
              res *= 0.7;
            } else {
              res *= 0.3;
            }
          }

          res *= 0.5;
        }
      }

      return res;
    },

    getDarkBlueChromosomeOffspringFactor: function (alleleList) {
      var res = 1.0;
      var i;
      var darkFound,
        parblueFound = false;
      var darkAllele,
        parblueAllele = null;
      var splitOrEFCount = 0;

      for (i = 0; i < alleleList.length; i++) {
        var allele = alleleList[i];
        if (
          allele.getMutation().getName() !== "gender_male" &&
          allele.getMutation().getName() !== "gender_female" &&
          allele.getMutation().getInheritanceMode() !==
          "heterosomal recessive" &&
          allele.getMutation().getInheritanceMode() !== "darkening factors"
        ) {
          if (
            this.getIsSplitOrEF(
              this.getMutationByMutationName(allele.getMutation().getName())
            )
          ) {
            if (allele.getMutation().getName() === "dark") {
              darkFound = true;
              darkAllele = allele;
              splitOrEFCount++;
            } else if (
              allele.getMutation().getName() === "blue" ||
              allele.getMutation().getName() === "turquoise" ||
              allele.getMutation().getName() === "aqua" ||
              allele.getMutation().getName() === "indigo" ||
              allele.getMutation().getName() === "sapphire" ||
              allele.getMutation().getName() === "whiteface" ||
              allele.getMutation().getName() === "pastelface" ||
              allele.getMutation().getName() === "creamface" ||
              allele.getMutation().getName() === "texasclearbody"||
              allele.getMutation().getName() === "yellowface2" ||
              allele.getMutation().getName() === "melanicshimmer" ||
              allele.getMutation().getName() === "goldface" ||
              allele.getMutation().getName() === "easleyclearbody" ||
              allele.getMutation().getName() === "whitecap" ||
              allele.getMutation().getName() === "greenline" ||
              allele.getMutation().getName() === "anthracite"
            ) {
              parblueFound = true;
              parblueAllele = allele;
              splitOrEFCount++;
            }
          }
        }
      }

      if (splitOrEFCount > 0) {
        if (splitOrEFCount === 1) {
          res *= 0.5;
        } else {
          if (darkFound && parblueFound) {
            if (this.isFittingChromatids([darkAllele, parblueAllele])) {
              res *= 0.86 * 0.5;
            } else {
              res *= 0.14 * 0.5;
            }
          }
        }
      }

      return res;
    },

    getRecombinationList: function () {
      var i;
      var res = [];
      var excludeList = {};
      var tmpBird = this;
      var tmpMutations = this.mutations;

      function getOtherMultiAlleleMutation(mutationToCheckAgainst) {
        var res = null;

        tmpMutations.forEach(function (mutation) {
          if (
            tmpBird.getIsUsed(mutation) &&
            mutation.getIsMultiAllelic() &&
            mutation.getMultiAlleleBase() ===
            mutationToCheckAgainst.getMultiAlleleBase() &&
            mutation.getName() !== mutationToCheckAgainst.getName()
          ) {
            res = mutation;
          }
        });

        return res;
      }

      function deepCopy(obj) {
        var out, i, j;
        if (Object.prototype.toString.call(obj) === "[object Array]") {
          var len = obj.length;
          out = [];
          i = 0;
          for (; i < len; i++) {
            out[i] = arguments.callee(obj[i]);
          }

          for (var meth in obj.__proto__) {
            if (obj.__proto__.hasOwnProperty(meth))
              out[meth] = obj.__proto__[meth];
          }

          return out;
        }
        if (typeof obj === "object") {
          out = {};
          for (j in obj) {
            out[j] = arguments.callee(obj[j]);
          }
          return out;
        }
        return obj;
      }

      this.mutations.forEach(function (mutation) {
        var reCombinedAlleles;

        if (
          tmpBird.getIsUsed(mutation) &&
          !excludeList.hasOwnProperty(mutation.getName())
        ) {
          if (
            tmpBird.getIsColor(mutation) ||
            tmpBird.getIsDF(mutation) ||
            mutation.getName() === "gender_male"
          ) {
            var alleleToAdd = Allele.fromMutationAndMutated(mutation, true);
            if (res.length === 0) {
              reCombinedAlleles = [];
              reCombinedAlleles.push(alleleToAdd);
              res.push(reCombinedAlleles);
            } else {
              for (i = 0; i < res.length; i++) {
                reCombinedAlleles = res[i];
                reCombinedAlleles.push(alleleToAdd);
              }
            }
          } else if (
            tmpBird.getIsSplit(mutation) ||
            tmpBird.getIsEF(mutation)
          ) {
            if (res.length > 0) {
              var clonedRes = deepCopy(res);
              res = res.concat(clonedRes.reverse());
            }
            if (
              mutation.getIsMultiAllelic() &&
              ((mutation.getMultiAlleleBase() === "dilute" &&
                tmpBird.getIsDiluteSeries()) ||
                (mutation.getMultiAlleleBase() === "NSLino" &&
                  tmpBird.getIsNSLinoSeries()) ||
                (mutation.getMultiAlleleBase() === "SLino" &&
                  tmpBird.getIsSLinoSeries()) ||
                (mutation.getMultiAlleleBase() === "blue" &&
                  tmpBird.getIsBlueSeries()) ||
                (mutation.getMultiAlleleBase() === "whiteface" &&
                  tmpBird.getIsBlueSeries()))
            ) {
              var otherMutation = getOtherMultiAlleleMutation(mutation);
              if (res.length === 0) {
                reCombinedAlleles = [];
                reCombinedAlleles.push(
                  Allele.fromMutationAndMutated(mutation, true)
                );
                res.push(reCombinedAlleles);

                reCombinedAlleles = [];
                reCombinedAlleles.push(
                  Allele.fromMutationAndMutated(otherMutation, true)
                );
                res.push(reCombinedAlleles);

                if (!excludeList.hasOwnProperty(otherMutation.getName())) {
                  excludeList[otherMutation.getName()] = "exists";
                }
              } else {
                for (i = 0; i < res.length; i++) {
                  reCombinedAlleles = res[i];
                  if (i % 2 === 0) {
                    reCombinedAlleles.push(
                      Allele.fromMutationAndMutated(mutation, true)
                    );
                  } else {
                    reCombinedAlleles.push(
                      Allele.fromMutationAndMutated(otherMutation, true)
                    );
                    if (!excludeList.hasOwnProperty(otherMutation.getName())) {
                      excludeList[otherMutation.getName()] = "exists";
                    }
                  }
                }
              }
            } else {
              if (res.length === 0) {
                reCombinedAlleles = [];
                reCombinedAlleles.push(
                  Allele.fromMutationAndMutated(mutation, true)
                );
                res.push(reCombinedAlleles);

                reCombinedAlleles = [];
                reCombinedAlleles.push(
                  Allele.fromMutationAndMutated(mutation, false)
                );
                res.push(reCombinedAlleles);
              } else {
                for (i = 0; i < res.length; i++) {
                  reCombinedAlleles = res[i];
                  reCombinedAlleles.push(
                    Allele.fromMutationAndMutated(mutation, i % 2 === 0)
                  );
                }
              }
            }
          } else if (mutation.getName() === "gender_female") {
            if (res.length === 0) {
              reCombinedAlleles = [];
              reCombinedAlleles.push(
                Allele.fromMutationAndMutated(mutation, true)
              );
              res.push(reCombinedAlleles);

              reCombinedAlleles = [];
              reCombinedAlleles.push(
                Allele.fromMutationAndMutated(
                  new Mutation(
                    -1000,
                    "gender_male",
                    "sex_linked",
                    "gender_male",
                    [],
                    0
                  ),
                  true
                )
              );
              res.push(reCombinedAlleles);
            }
          }
        }
      });

      res.forEach(function (alleleList) {
        if (alleleList) {
          tmpBird.detemineT1OrT2State(alleleList);
        }
      });

      return res;
    },

    setSplitOrEF: function (mutation) {
      if (mutation !== null) {
        switch (mutation.getInheritanceMode()) {
          case "autosomal recessive":
          case "heterosomal recessive":
            mutation.checked = "split";
            break;
          case "autosomal dominant":
          case "darkening factors":
            mutation.checked = "SF";
            break;
          default:
        }
      }
    },

    setColorOrDF: function (mutation) {
      if (mutation !== null) {
        switch (mutation.getInheritanceMode()) {
          case "autosomal recessive":
            mutation.checked = "color";
            break;
          case "autosomal dominant":
            mutation.checked = "DF";
            break;
          case "heterosomal recessive":
            if (this.getGender() === "male") {
              mutation.checked = "color";
            } else if (this.getGender() === "female") {
              mutation.checked = "split";
            }
            break;
          case "darkening factors":
            if (this.getGender() === "male") {
              mutation.checked = "DF";
            } else if (this.getGender() === "female") {
              mutation.checked = "SF";
            }
            break;
          default:
        }
      }
    },

    getGenSymbolFromMutationName: function (mutationName) {
      var res = "";

      switch (mutationName) {
        //autosomal recessive
        //novos 1
        case "black wings":
          res = "bla";
          break;

        case "fullbody":
              res = "ful";
              break;

        case "faded2":
              res = "fad";
              break;

        case "spotted":
              res = "spo";
              break;

        case "striped":
              res = "str";
              break;
        case "fallow":
          res = "fl";
          break;
        //
        case "NSLino":
          res = "a";
          break;
        case "bronze fallow":
          res = "bz";
          break;
        case "pastel":
          res = "pa";
          break;
        case "DEC":
          res = "dec";
          break;
        case "blue":
          res = "bl";
          break;
        case "turquoise":
          res = "tq";
          break;
        case "indigo":
          res = "in";
          break;
        case "aqua":
          res = "aq";
          break;
        case "sapphire":
          res = "sa";
          break;
        case "whiteface":
          res = "bl";
          break;
        case "pastelface":
          res = "aq";
          break;
        case "creamface":
          res = "tq";
          break;
        case "cleartail":
          res = "ct";
          break;
        case "clearhead fallow":
          res = "cf";
          break;
        case "dun fallow":
          res = "df";
          break;
        case "pale fallow":
          res = "pf";
          break;
        case "rec. pied":
          res = "s";
          break;
        case "rec. pied(DNK)":
          res = "s";
          break;
        case "rec. edged":
          res = "ed";
          break;
        case "dilute":
          res = "dil";
          break;
        case "clearwing":
          res = "cw";
          break;
        case "greywing":
          res = "gw";
          break;
        case "rec. grey":
          res = "g";
          break;
        case "rec. grey(AUS)":
          res = "ag";
          break;
        case "rec. grey(ENG)":
          res = "eg";
          break;
        case "orange face":
          res = "of";
          break;
        case "rec. silver":
          res = "sf";
          break;
        case "faded":
          res = "fd";
          break;
        case "emerald":
          res = "em";
          break;
        case "saddleback":
          res = "sa";
          break;
        case "brownwing":
          res = "bw";
          break;
        case "blackface":
          res = "bf";
          break;
        case "marbled":
          res = "mb";
          break;
        case "melanistic":
          res = "m";
          break;
        case "golden":
          res = "go";
          break;
        //autosomal dominant
        //novos 2
        case "yellowface2":
          res = "yel2";
          break;

        case "melanicshimmer":
              res = "mel";
              break;

        case "goldface":
              res = "gol";
              break;

        case "easleyclearbody":
              res = "eas";
              break;

        case "whitecap":
              res = "whi";
              break;

        case "greenline":
              res = "gre";
              break;

        case "anthracite":
              res = "ant";
              break;
        case "adh":
          res = "adh";
          break;

        case "adhfrosted":
              res = "adh";
              break;

        case "cop":
              res = "cop";
              break;

        case "lightharlequin":
              res = "lig";
              break;
        //
        case "dark":
          res = "D";
          break;
        case "violet":
          res = "V";
          break;
        case "grey":
          res = "G";
          break;
        case "deep":
          res = "Dp";
          break;
        case "misty":
          res = "Mt";
          break;
        case "khaki":
          res = "Kh";
          break;
        case "slaty":
          res = "Slt";
          break;
        case "euwing":
          res = "Ew";
          break;
        case "dom. pied":
          res = "Pi";
          break;
        case "dom. pied(AUS)":
          res = "Pb";
          break;
        case "dom. pied(NL)":
          res = "Pi";
          break;
        case "spangle":
          res = "Sp";
          break;
        case "pale headed":
          res = "Ph";
          break;
        case "dom. silver":
          res = "Si";
          break;
        case "dom. yellowcheek":
          res = "Ych";
          break;
        case "clearbody":
          res = "Cl";
          break;
        case "yellowface1":
          res = "yel1";
          break;
        case "bronze":
          res = "Brz";
          break;
        //heterosomal recessive
        //novos 3
        case "texasclearbody":
          res = "tex";
          break;

        case "sealed":
              res = "sea";
              break;

        case "lace":
              res = "lac";
              break;

        case "cinnamonwings":
              res = "cin";
              break;
        //
        case "SLino":
          res = "ino";
          break;
        case "pallid":
          res = "pd";
          break;
        case "platinum":
          res = "pl";
          break;
        case "opaline":
          res = "op";
          break;
        case "cinnamon":
          res = "cin";
          break;
        case "slate":
          res = "sl";
          break;
        case "SL yellowcheek":
          res = "ych";
          break;
        case "pewter":
          res = "pw";
          break;

        //novos 6
        case "onefator":
          res = "D";
          break;
        case "twofator":
          res = "DD";
          break;
        case "violet2":
          res = "V";
          break;
        default:
          break;
      }
      return res;
    },

    getParBlueGenFormula: function () {
      var res = "";
      var leftPart = "";
      var rightPart = "";

      var tmpBird = this;

      this.mutations.forEach(function (mutation) {
        if (
          mutation.getName() === "blue" ||
          mutation.getName() === "turquoise" ||
          mutation.getName() === "aqua" ||
          mutation.getName() === "indigo" ||
          mutation.getName() === "sapphire" ||
          mutation.getName() === "whiteface" ||
          mutation.getName() === "pastelface" ||
          mutation.getName() === "creamface"||
          mutation.getName() === "texasclearbody"||
          mutation.getName() === "yellowface2" ||
          mutation.getName() === "melanicshimmer" ||
          mutation.getName() === "goldface" ||
          mutation.getName() === "easleyclearbody" ||
          mutation.getName() === "whitecap" ||
          mutation.getName() === "greenline" ||
          mutation.getName() === "anthracite"
        ) {
          if (tmpBird.getIsUsed(mutation)) {
            if (tmpBird.getIsBlueSeries()) {
              // homozygous or visual heterozygous
              if (mutation.getChecked() === "color") {
                // homozygous
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                // visual heterozygous
                if (mutation.getIsT1OrT2()) {
                  if (leftPart === "") {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      leftPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                    } else {
                      leftPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                    }
                  } else if (rightPart === "") {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      rightPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                    } else {
                      rightPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                    }
                  }
                } else {
                  if (rightPart === "") {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      rightPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                    } else {
                      rightPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                    }
                  } else if (leftPart === "") {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      leftPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                    } else {
                      leftPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                    }
                  }
                }
              }
            } else {
              if (mutation.getChecked() === "color") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                if (mutation.getIsT1OrT2()) {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) + "<sup>+</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "<sup>+</sup>";
                  }
                } else {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) + "<sup>+</sup>";
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "<sup>+</sup>";
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                }
              }
            }
          }
        }
      });

      if (leftPart !== "" && rightPart !== "") {
        res = leftPart + "%" + rightPart;
      }

      return res;
    },

    getDiluteGenFormula: function () {
      var res = "";
      var leftPart = "";
      var rightPart = "";

      var tmpBird = this;

      this.mutations.forEach(function (mutation) {
        if (
          mutation.getName() === "dilute" ||
          mutation.getName() === "clearwing" ||
          mutation.getName() === "greywing"
        ) {
          if (tmpBird.getIsUsed(mutation)) {
            if (tmpBird.getIsDiluteSeries()) {
              if (mutation.getChecked() === "color") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                if (leftPart === "") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                } else if (rightPart === "") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                }
              }
            } else {
              if (mutation.getChecked() === "color") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) + "<sup>+</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "<sup>+</sup>";
                }
              }
            }
          }
        }
      });

      if (leftPart !== "" && rightPart !== "") {
        res = leftPart + "/" + rightPart;
      }

      return res;
    },

    getNSLinoGenFormula: function () {
      var res = "";
      var leftPart = "";
      var rightPart = "";

      var tmpBird = this;

      this.mutations.forEach(function (mutation) {
        if (
          mutation.getName() === "NSLino" ||
          mutation.getName() === "bronze fallow" ||
          mutation.getName() === "pastel" ||
          mutation.getName() === "DEC"
        ) {
          if (tmpBird.getIsUsed(mutation)) {
            if (tmpBird.getIsNSLinoSeries()) {
              if (mutation.getChecked() === "color") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                if (leftPart === "") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                } else if (rightPart === "") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                }
              }
            } else {
              if (mutation.getChecked() === "color") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (mutation.getChecked() === "split") {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) + "<sup>+</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "<sup>+</sup>";
                }
              }
            }
          }
        }
      });

      if (leftPart !== "" && rightPart !== "") {
        res = leftPart + "/" + rightPart;
      }

      return res;
    },

    getSexChromosomeGenFormula: function () {
      var multiAlleleAdded = false;
      var res = "";
      var leftPart = "";
      var rightPart = "";

      var tmpBird = this;

      this.mutations.forEach(function (mutation) {
        if (
          mutation.getName() === "SLino" ||
          mutation.getName() === "pallid" ||
          mutation.getName() === "platinum"
        ) {
          if (tmpBird.getIsUsed(mutation)) {
            if (tmpBird.getIsSLinoSeries()) {
              if (tmpBird.getGender() === "male") {
                if (mutation.getChecked() === "color") {
                  if (leftPart !== "") {
                    leftPart += "_";
                  }
                  if (rightPart !== "") {
                    rightPart += "_";
                  }
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                } else if (mutation.getChecked() === "split") {
                  if (!multiAlleleAdded) {
                    if (mutation.getIsT1OrT2()) {
                      if (leftPart !== "") {
                        leftPart += "_";
                      }
                      if (
                        mutation.getMultiAlleleBase() !== mutation.getName()
                      ) {
                        leftPart +=
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getMultiAlleleBase()
                          ) +
                          "<sup>" +
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getName()
                          ) +
                          "</sup>";
                      } else {
                        leftPart += tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        );
                      }
                    } else {
                      if (rightPart !== "") {
                        rightPart += "_";
                      }
                      if (
                        mutation.getMultiAlleleBase() !== mutation.getName()
                      ) {
                        rightPart +=
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getMultiAlleleBase()
                          ) +
                          "<sup>" +
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getName()
                          ) +
                          "</sup>";
                      } else {
                        rightPart += tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        );
                      }
                    }
                    multiAlleleAdded = true;
                  } else {
                    if (!mutation.getIsT1OrT2()) {
                      if (rightPart !== "") {
                        rightPart += "_";
                      }
                      if (
                        mutation.getMultiAlleleBase() !== mutation.getName()
                      ) {
                        rightPart +=
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getMultiAlleleBase()
                          ) +
                          "<sup>" +
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getName()
                          ) +
                          "</sup>";
                      } else {
                        rightPart += tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        );
                      }
                    } else {
                      if (leftPart !== "") {
                        leftPart += "_";
                      }
                      if (
                        mutation.getMultiAlleleBase() !== mutation.getName()
                      ) {
                        leftPart +=
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getMultiAlleleBase()
                          ) +
                          "<sup>" +
                          tmpBird.getGenSymbolFromMutationName(
                            mutation.getName()
                          ) +
                          "</sup>";
                      } else {
                        leftPart += tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        );
                      }
                    }
                  }
                }
              } else if (tmpBird.getGender() === "female") {
                if (mutation.getChecked() === "split") {
                  if (leftPart !== "") {
                    leftPart += "_";
                  }
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                }
              }
            } else {
              if (tmpBird.getGender() === "male") {
                if (leftPart !== "") {
                  leftPart += "_";
                }
                if (rightPart !== "") {
                  rightPart += "_";
                }
                if (mutation.getChecked() === "color") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                } else if (mutation.getChecked() === "split") {
                  if (mutation.getIsT1OrT2()) {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      leftPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                      rightPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) + "<sup>+</sup>";
                    } else {
                      leftPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                      rightPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) + "<sup>+</sup>";
                    }
                  } else {
                    if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                      rightPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) +
                        "<sup>" +
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) +
                        "</sup>";
                      leftPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getMultiAlleleBase()
                        ) + "<sup>+</sup>";
                    } else {
                      rightPart += tmpBird.getGenSymbolFromMutationName(
                        mutation.getName()
                      );
                      leftPart +=
                        tmpBird.getGenSymbolFromMutationName(
                          mutation.getName()
                        ) + "<sup>+</sup>";
                    }
                  }
                }
              } else if (tmpBird.getGender() === "female") {
                if (leftPart !== "") {
                  leftPart += "_";
                }
                if (mutation.getChecked() === "split") {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                  }
                }
              }
            }
          }
        } else if (
          mutation.getName() === "opaline" ||
          mutation.getName() === "cinnamon" ||
          mutation.getName() === "slate" ||
          mutation.getName() === "SL edged" ||
          mutation.getName() === "SL yellowcheek" ||
          mutation.getName() === "pewter"
        ) {
          if (tmpBird.getIsUsed(mutation)) {
            if (tmpBird.getGender() === "male") {
              if (leftPart !== "") {
                leftPart += "_";
              }
              if (rightPart !== "") {
                rightPart += "_";
              }
              if (
                mutation.getChecked() === "color" ||
                mutation.getChecked() === "DF"
              ) {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                  rightPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                  rightPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              } else if (
                mutation.getChecked() === "split" ||
                mutation.getChecked() === "SF"
              ) {
                if (mutation.getIsT1OrT2()) {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) + "<sup>+</sup>";
                  } else {
                    leftPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "<sup>+</sup>";
                  }
                } else {
                  if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                    rightPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) +
                      "<sup>" +
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "</sup>";
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(
                        mutation.getMultiAlleleBase()
                      ) + "<sup>+</sup>";
                  } else {
                    rightPart += tmpBird.getGenSymbolFromMutationName(
                      mutation.getName()
                    );
                    leftPart +=
                      tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                      "<sup>+</sup>";
                  }
                }
              }
            } else if (tmpBird.getGender() === "female") {
              if (leftPart !== "") {
                leftPart += "_";
              }
              if (
                mutation.getChecked() === "split" ||
                mutation.getChecked() === "SF"
              ) {
                if (mutation.getMultiAlleleBase() !== mutation.getName()) {
                  leftPart +=
                    tmpBird.getGenSymbolFromMutationName(
                      mutation.getMultiAlleleBase()
                    ) +
                    "<sup>" +
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "</sup>";
                } else {
                  leftPart += tmpBird.getGenSymbolFromMutationName(
                    mutation.getName()
                  );
                }
              }
            }
          }
        }
      });

      if (leftPart !== "") {
        leftPart = "Z " + leftPart;
      } else {
        leftPart = "Z";
      }

      if (tmpBird.getGender() === "female") {
        rightPart = "W";
      } else if (tmpBird.getGender() === "male") {
        if (rightPart !== "") {
          rightPart = "Z " + rightPart;
        } else {
          rightPart = "Z";
        }
      }

      if (leftPart !== "" && rightPart !== "") {
        res = leftPart + "/" + rightPart;
      }

      return res;
    },

    getDarkBlueChromosomeGenFormula: function () {
      var res = "";
      var tmpBird = this;
      var parBlueGenFormula = this.getParBlueGenFormula();

      if (parBlueGenFormula !== "") {
        var parBlueGenFormulas = parBlueGenFormula.split("%");
        if (parBlueGenFormulas.length === 2) {
          this.mutations.forEach(function (mutation) {
            if (mutation.getName() === "dark") {
              if (tmpBird.getIsUsed(mutation)) {
                if (mutation.getChecked() === "DF") {
                  parBlueGenFormulas[0] =
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "_" +
                    parBlueGenFormulas[0];
                  parBlueGenFormulas[1] =
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "_" +
                    parBlueGenFormulas[1];
                } else if (mutation.getChecked() === "SF") {
                  parBlueGenFormulas[0] =
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "_" +
                    parBlueGenFormulas[0];
                  parBlueGenFormulas[1] =
                    tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                    "<sup>+</sup>_" +
                    parBlueGenFormulas[1];
                }
              }
              res = parBlueGenFormulas[0] + "/" + parBlueGenFormulas[1];
            }
          });
          if (res === "") {
            //no dark factor available
            parBlueGenFormulas[0] =
              tmpBird.getGenSymbolFromMutationName("dark") +
              "<sup>+</sup>_" +
              parBlueGenFormulas[0];
            parBlueGenFormulas[1] =
              tmpBird.getGenSymbolFromMutationName("dark") +
              "<sup>+</sup>_" +
              parBlueGenFormulas[1];
            res = parBlueGenFormulas[0] + "/" + parBlueGenFormulas[1];
          }
        }
      } else {
        //no parblue available
        this.mutations.forEach(function (mutation) {
          if (mutation.getName() === "dark") {
            if (tmpBird.getIsUsed(mutation)) {
              if (mutation.getChecked() === "DF") {
                res =
                  tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                  "_" +
                  tmpBird.getGenSymbolFromMutationName("blue") +
                  "<sup>+</sup>/";
                res +=
                  tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                  "_" +
                  tmpBird.getGenSymbolFromMutationName("blue") +
                  "<sup>+</sup>";
              } else if (mutation.getChecked() === "SF") {
                res =
                  tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                  "_" +
                  tmpBird.getGenSymbolFromMutationName("blue") +
                  "<sup>+</sup>/";
                res +=
                  tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                  "<sup>+</sup>_" +
                  tmpBird.getGenSymbolFromMutationName("blue") +
                  "<sup>+</sup>";
              }
            }
          }
        });
      }

      return res;
    },

    getGenFormula: function () {
      var res = "???";
      var leftPart = "";
      var rightPart = "";
      var tmpBird = this;
      var diluteGenFormula = this.getDiluteGenFormula();
      var nslInoGenFormula = this.getNSLinoGenFormula();
      var sexChromosomeGenFormula = this.getSexChromosomeGenFormula();
      var darkBlueChromosomeGenFormula = this.getDarkBlueChromosomeGenFormula();

      this.mutations.forEach(function (mutation) {
        leftPart = "";
        rightPart = "";
        if (tmpBird.getIsUsed(mutation)) {
          if (
            mutation.getName() !== "dark" &&
            mutation.getName() !== "blue" &&
            mutation.getName() !== "turquoise" &&
            mutation.getName() !== "aqua" &&
            mutation.getName() !== "indigo" &&
            mutation.getName() !== "sapphire" &&
            mutation.getName() !== "whiteface" &&
            mutation.getName() !== "pastelface" &&
            mutation.getName() !== "creamface" &&
            mutation.getName() !== "texasclearbody" &&
            mutation.getName() !== "dilute" &&
            mutation.getName() !== "clearwing" &&
            mutation.getName() !== "greywing" &&
            mutation.getName() !== "NSLino" &&
            mutation.getName() !== "bronze fallow" &&
            mutation.getName() !== "pastel" &&
            mutation.getName() !== "DEC" &&
            mutation.getName() !== "SLino" &&
            mutation.getName() !== "pallid" &&
            mutation.getName() !== "platinum" &&
            mutation.getName() !== "opaline" &&
            mutation.getName() !== "cinnamon" &&
            mutation.getName() !== "slate" &&
            mutation.getName() !== "SL edged" &&
            mutation.getName() !== "SL yellowcheek" &&
            mutation.getName() !== "pewter" &&
            mutation.getName() !== "gender_male" &&
            mutation.getName() !== "gender_female"
          ) {
            if (
              mutation.getChecked() === "color" ||
              mutation.getChecked() === "DF"
            ) {
              leftPart += tmpBird.getGenSymbolFromMutationName(
                mutation.getName()
              );
              rightPart += tmpBird.getGenSymbolFromMutationName(
                mutation.getName()
              );
            } else if (
              mutation.getChecked() === "split" ||
              mutation.getChecked() === "SF"
            ) {
              leftPart += tmpBird.getGenSymbolFromMutationName(
                mutation.getName()
              );
              rightPart +=
                tmpBird.getGenSymbolFromMutationName(mutation.getName()) +
                "<sup>+</sup>";
            }
            if (leftPart !== "" && rightPart !== "") {
              if (res !== "???") {
                res += "; ";
              } else {
                res = "";
              }
              res += leftPart + "/" + rightPart;
            }
          }
        }
      });

      if (diluteGenFormula !== "") {
        if (res === "???") {
          res = diluteGenFormula;
        } else {
          res += "; " + diluteGenFormula;
        }
      }

      if (nslInoGenFormula !== "") {
        if (res === "???") {
          res = nslInoGenFormula;
        } else {
          res += "; " + nslInoGenFormula;
        }
      }

      if (darkBlueChromosomeGenFormula !== "") {
        if (res === "???") {
          res = darkBlueChromosomeGenFormula;
        } else {
          res += "; " + darkBlueChromosomeGenFormula;
        }
      }

      if (sexChromosomeGenFormula !== "") {
        if (res === "???") {
          res = sexChromosomeGenFormula;
        } else {
          res += "; " + sexChromosomeGenFormula;
        }
      }

      return res;
    },

    Reset: function () {
      this.mutations.forEach(function (mutation) {
        mutation.checked = "";
        mutation.isT1orT2 = false;
      });
    },

    RefreshCulture: function () {
      this.mutations.forEach(function (mutation) {
        mutation.RefreshCulture();
      });
    },
  };

  Bird.fromJson = function (json) {
    var obj = JSON.parse(json);
    var newBird = new Bird(obj.gender);

    obj.mutations.forEach(function (mutation) {
      newBird.mutations[newBird.getIndexOfMutation(mutation)].checked =
        mutation.checked;
    });

    return newBird;
  };

  Bird.fromJsonObject = function (obj) {
    var newBird = new Bird(obj.gender);
    obj.mutations.forEach(function (mutation) {
      newBird.mutations[newBird.getIndexOfMutation(mutation)].checked =
        mutation.checked;
    });
    return newBird;
  };

  return Bird;
});

app.factory("GenCalcEngine", function (Bird, ResultList) {
  function GenCalcEngine(father, mother) {
    this.father = father;
    this.mother = mother;
  }

  GenCalcEngine.prototype = {
    getFather: function () {
      return this.father;
    },

    getMother: function () {
      return this.mother;
    },

    CalcResults: function (gender) {
      var res = new ResultList();
      var father = this.getFather();
      var mother = this.getMother();
      var rclFather = father.getRecombinationList();
      var rclMother = mother.getRecombinationList();

      function getAlleleByMutationName(mutationName, alleleList) {
        var resAllele = null;

        if (alleleList.length > 0) {
          for (var i = 0; i < alleleList.length; i++) {
            if (alleleList[i].getMutation().getName() === mutationName) {
              resAllele = alleleList[i];
              break;
            }
          }
        }

        return resAllele;
      }

      if (rclFather.length > 0 && rclMother.length > 0) {
        for (var i = 0; i < rclMother.length; i++) {
          var alMother = rclMother[i];
          for (var j = 0; j < rclFather.length; j++) {
            var alFather = rclFather[j];
            var genderMale = getAlleleByMutationName("gender_male", alFather);
            var genderFemale = getAlleleByMutationName(
              "gender_female",
              alMother
            );
            if (genderFemale === null) {
              genderFemale = getAlleleByMutationName("gender_male", alMother);
            }

            if (
              (gender === "male" &&
                genderMale !== null &&
                genderMale.getMutation().getName() === "gender_male" &&
                genderFemale !== null &&
                genderFemale.getMutation().getName() === "gender_male") ||
              (gender === "female" &&
                genderMale !== null &&
                genderMale.getMutation().getName() === "gender_male" &&
                genderFemale !== null &&
                genderFemale.getMutation().getName() === "gender_female")
            ) {
              console.log(
                "offspringFactor-father: " + father.getOffspringFactor(alFather)
              );
              console.log(
                "offspringFactor-mother: " + mother.getOffspringFactor(alMother)
              );
              res.AddBird(
                this.CalcOffspringBird(gender, alFather, alMother),
                father.getOffspringFactor(alFather) *
                mother.getOffspringFactor(alMother)
              );
            }
          }
        }
      }

      console.log("Bird-Count: " + res.getOffspringCount());
      return res;
    },

    CalcOffspringBird: function (gender, alleleListFather, alleleListMother) {
      var i;
      var res = new Bird(gender);

      for (i = 0; i < alleleListFather.length; i++) {
        var alleleFather = alleleListFather[i];

        if (
          alleleFather.getMutation().getName() !== "gender_male" &&
          alleleFather.getMutation().getName() !== "gender_female"
        ) {
          if (alleleFather.getMutated()) {
            var mutationFather =
              res.mutations[res.getIndexOfMutation(alleleFather.getMutation())];
            if (mutationFather !== null) {
              if (gender === "male") {
                res.setSplitOrEF(mutationFather);
              } else if (gender === "female") {
                if (
                  alleleFather.getMutation().getInheritanceMode() ===
                  "heterosomal recessive" ||
                  alleleFather.getMutation().getInheritanceMode() ===
                  "darkening factors"
                ) {
                  res.setColorOrDF(mutationFather);
                } else {
                  res.setSplitOrEF(mutationFather);
                }
              }

              if (alleleFather.getIsT1OrT2()) mutationFather.isT1orT2 = true;
            }
          }
        }
      }

      for (i = 0; i < alleleListMother.length; i++) {
        var alleleMother = alleleListMother[i];

        if (
          alleleMother.getMutation().getName() !== "gender_male" &&
          alleleMother.getMutation().getName() !== "gender_female"
        ) {
          if (alleleMother.getMutated()) {
            var mutationMother =
              res.mutations[res.getIndexOfMutation(alleleMother.getMutation())];
            if (gender === "male") {
              if (res.getIsSplitOrEF(mutationMother)) {
                res.setColorOrDF(mutationMother);
              } else {
                res.setSplitOrEF(mutationMother);
                if (
                  alleleMother.getMutation().getInheritanceMode() ===
                  "heterosomal recessive"
                ) {
                  mutationMother.isT1orT2 = true;
                }
              }
            } else if (gender === "female") {
              if (
                alleleMother.getMutation().getInheritanceMode() !==
                "heterosomal recessive" &&
                alleleMother.getMutation().getInheritanceMode() !==
                "darkening factors"
              ) {
                if (res.getIsSplitOrEF(mutationMother)) {
                  res.setColorOrDF(mutationMother);
                } else {
                  res.setSplitOrEF(mutationMother);
                }
              }
            }

            if (alleleMother.getIsT1OrT2()) mutationMother.isT1orT2 = true;
          }
        }
      }

      res.RefreshCulture();

      //console.log('Res-Bird: ' + res.getMutationFullName());
      return res;
    },
  };

  return GenCalcEngine;
});

app.factory("ReverseGenCalcEngine", function (Bird, Pairing) {
  function ReverseGenCalcEngine(birdOfInterest) {
    this.birdOfInterest = birdOfInterest;
  }

  ReverseGenCalcEngine.prototype = {
    getBirdOfInterest: function () {
      return this.birdOfInterest;
    },

    CalcResults: function (
      gender,
      species,
      optimal,
      calcOnlyChosenAlleles,
      autosomalRecessiveMutationList,
      heteroomalRecessiveMutationList
    ) {
      function deepCopy(obj) {
        var out, i, j;
        if (Object.prototype.toString.call(obj) === "[object Array]") {
          var len = obj.length;
          out = [];
          i = 0;
          for (; i < len; i++) {
            out[i] = arguments.callee(obj[i]);
          }

          for (var meth in obj.__proto__) {
            if (obj.__proto__.hasOwnProperty(meth))
              out[meth] = obj.__proto__[meth];
          }

          return out;
        }
        if (typeof obj === "object") {
          out = {};
          for (j in obj) {
            out[j] = arguments.callee(obj[j]);
          }
          return out;
        }
        return obj;
      }

      var tmpMutations = this.birdOfInterest.getMutations();
      function getOtherMultiAlleleMutation(mutationToCheckAgainst) {
        var res = null;

        tmpMutations.forEach(function (mutation) {
          if (
            tmpBird.getIsUsed(mutation) &&
            mutation.getIsMultiAllelic() &&
            mutation.getMultiAlleleBase() ===
            mutationToCheckAgainst.getMultiAlleleBase() &&
            mutation.getName() !== mutationToCheckAgainst.getName()
          ) {
            res = mutation;
          }
        });

        return res;
      }

      function getOtherMultiAlleleMutations(
        speciesToCheck,
        mutationList,
        multiAlleleBaseName,
        excludeNames
      ) {
        var res = [];

        mutationList.ref_mutations.forEach(function (mutation) {
          var speciesIndex = mutation.species.findIndex(
            (sp) => sp.name === speciesToCheck
          );
          if (
            speciesIndex > -1 &&
            mutation.multiAlleleBase === multiAlleleBaseName &&
            excludeNames.indexOf(mutation.name) < 0
          ) {
            res.push(mutation);
          }
        });

        return res;
      }

      var excludeList = {};
      var res = [];
      var father = new Bird("male");
      var mother = new Bird("female");
      res.push(new Pairing(father, mother));

      var tmpBird = this.birdOfInterest;
      this.birdOfInterest.getMutations().forEach(function (mutation) {
        if (
          tmpBird.getIsUsed(mutation) &&
          !excludeList.hasOwnProperty(mutation.getName())
        ) {
          var tempRes = [];

          if (tmpBird.getIsColor(mutation) || tmpBird.getIsDF(mutation)) {
            // || (mutation.getName() === 'gender_male')

            var tmpPairing;
            var mutationFather;
            var mutationMother;
            var newPairing;

            res.forEach(function (pairing) {
              // split x color || EF x DF
              tmpPairing = angular.copy(pairing); //deepCopy(pairing);
              mutationFather =
                tmpPairing.father.mutations[
                tmpPairing.father.getIndexOfMutation(mutation)
                ];
              mutationMother =
                tmpPairing.mother.mutations[
                tmpPairing.mother.getIndexOfMutation(mutation)
                ];
              tmpPairing.father.setSplitOrEF(mutationFather);
              tmpPairing.mother.setColorOrDF(mutationMother);
              newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
              newPairing.optimationCount = tmpPairing.optimationCount + 7;
              tempRes.push(newPairing);
              if (
                mutation.getInheritanceMode() !== "heterosomal recessive" &&
                mutation.getInheritanceMode() !== "darkening factors"
              ) {
                // color x split || DF x EF
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 5;
                tempRes.push(newPairing);
              } else {
                if (gender === "female") {
                  // color x wildtype || DF x wildtype
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setColorOrDF(mutationFather);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 5;
                  tempRes.push(newPairing);
                }
              }
              if (!optimal) {
                if (
                  mutation.getInheritanceMode() !== "heterosomal recessive" &&
                  mutation.getInheritanceMode() !== "darkening factors"
                ) {
                  // split x split || EF x EF
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 3;
                  tempRes.push(newPairing);
                }
                // color x color || DF x DF
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount;
                tempRes.push(newPairing);
              }
            });

            res = tempRes;
          } else if (
            tmpBird.getIsSplit(mutation) ||
            tmpBird.getIsEF(mutation)
          ) {
            var tmpPairing;
            var mutationFather;
            var mutationMother;

            // check whether heterozygous multi-allelic combo
            if (
              mutation.getIsMultiAllelic() &&
              ((mutation.getMultiAlleleBase() === "dilute" &&
                tmpBird.getIsDiluteSeries()) ||
                (mutation.getMultiAlleleBase() === "NSLino" &&
                  tmpBird.getIsNSLinoSeries()) ||
                (mutation.getMultiAlleleBase() === "SLino" &&
                  tmpBird.getIsSLinoSeries()) ||
                (mutation.getMultiAlleleBase() === "blue" &&
                  tmpBird.getIsBlueSeries()) ||
                (mutation.getMultiAlleleBase() === "whiteface" &&
                  tmpBird.getIsBlueSeries()))
            ) {
              var otherMutation = getOtherMultiAlleleMutation(mutation);

              res.forEach(function (pairing) {
                // split mutation x color otherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 16;
                tempRes.push(newPairing);
                // color mutation x split OtherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 15;
                tempRes.push(newPairing);
                // split otherMutation x color mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 14;
                tempRes.push(newPairing);
                // color otherMutation x split mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 13;
                tempRes.push(newPairing);

                // split mutation x split mutation split otherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 12;
                tempRes.push(newPairing);
                // split mutation split otherMutation x split OtherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 11;
                tempRes.push(newPairing);
                // split otherMutation x split otherMutation split mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 10;
                tempRes.push(newPairing);
                // split mutation split otherMutation x split mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 9;
                tempRes.push(newPairing);

                // color mutation x color otherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 8;
                tempRes.push(newPairing);
                // color otherMutation x color mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 7;
                tempRes.push(newPairing);

                // color mutation x split mutation split otherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 6;
                tempRes.push(newPairing);
                // split mutation split otherMutation x color OtherMutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 5;
                tempRes.push(newPairing);
                // color otherMutation x split otherMutation split mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.mother.setSplitOrEF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 4;
                tempRes.push(newPairing);
                // split mutation split otherMutation x color mutation
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(otherMutation)
                  ];
                tmpPairing.father.setSplitOrEF(mutationFather);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 3;
                tempRes.push(newPairing);
                if (!optimal) {
                  // split mutation x split otherMutation
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(otherMutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 2;
                  tempRes.push(newPairing);
                  // split otherMutation x split mutation
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(otherMutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 1;
                  tempRes.push(newPairing);
                }
              });

              if (!excludeList.hasOwnProperty(otherMutation.getName())) {
                excludeList[otherMutation.getName()] = "exists";
              }

              if (!calcOnlyChosenAlleles) {
                var arrayOtherAlleleMutations = getOtherMultiAlleleMutations(
                  species,
                  mutation.getInheritanceMode() === "autosomal recessive"
                    ? autosomalRecessiveMutationList
                    : heteroomalRecessiveMutationList,
                  mutation.getMultiAlleleBase(),
                  [mutation.getName(), otherMutation.getName()]
                );

                arrayOtherAlleleMutations.forEach(function (
                  otherAlleleMutation
                ) {
                  res.forEach(function (pairing) {
                    // split mutation x split otherAlleleMutation split otherMutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // split otherAlleleMutation split otherMutation x split mutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // split otherMutation x split otherAlleleMutation split mutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // split otherAlleleMutation split mutation x split otherMutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);

                    // color mutation x split otherAlleleMutation split otherMutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setColorOrDF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // split otherAlleleMutation split otherMutation x color mutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.mother.setColorOrDF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // color otherMutation x split otherAlleleMutation split mutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.father.setColorOrDF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);
                    // split otherAlleleMutation split mutation x color otherMutation
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(
                        otherAlleleMutation
                      )
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(otherMutation)
                      ];
                    tmpPairing.mother.setColorOrDF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount =
                      tmpPairing.optimationCount + 12;
                    tempRes.push(newPairing);

                    var arrayOtherAlleleMutationsWithoutOtherAlleleMutation =
                      angular
                        .copy(arrayOtherAlleleMutations)
                        .filter((elem) => elem !== otherAlleleMutation);
                    arrayOtherAlleleMutationsWithoutOtherAlleleMutation.forEach(
                      function (tmpItem) {
                        // split otherAlleleMutation split mutation x split tmpItem split otherMutation
                        tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                        mutationFather =
                          tmpPairing.father.mutations[
                          tmpPairing.father.getIndexOfMutation(
                            otherAlleleMutation
                          )
                          ];
                        tmpPairing.father.setSplitOrEF(mutationFather);
                        mutationFather =
                          tmpPairing.father.mutations[
                          tmpPairing.father.getIndexOfMutation(mutation)
                          ];
                        tmpPairing.father.setSplitOrEF(mutationFather);
                        mutationMother =
                          tmpPairing.mother.mutations[
                          tmpPairing.mother.getIndexOfMutation(tmpItem)
                          ];
                        tmpPairing.mother.setSplitOrEF(mutationMother);
                        mutationMother =
                          tmpPairing.mother.mutations[
                          tmpPairing.mother.getIndexOfMutation(otherMutation)
                          ];
                        tmpPairing.mother.setSplitOrEF(mutationMother);
                        newPairing = new Pairing(
                          tmpPairing.father,
                          tmpPairing.mother
                        );
                        newPairing.optimationCount =
                          tmpPairing.optimationCount + 12;
                        tempRes.push(newPairing);

                        // split otherAlleleMutation split otherMutation x split tmpItem split mutation
                        tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                        mutationFather =
                          tmpPairing.father.mutations[
                          tmpPairing.father.getIndexOfMutation(
                            otherAlleleMutation
                          )
                          ];
                        tmpPairing.father.setSplitOrEF(mutationFather);
                        mutationFather =
                          tmpPairing.father.mutations[
                          tmpPairing.father.getIndexOfMutation(otherMutation)
                          ];
                        tmpPairing.father.setSplitOrEF(mutationFather);
                        mutationMother =
                          tmpPairing.mother.mutations[
                          tmpPairing.mother.getIndexOfMutation(tmpItem)
                          ];
                        tmpPairing.mother.setSplitOrEF(mutationMother);
                        mutationMother =
                          tmpPairing.mother.mutations[
                          tmpPairing.mother.getIndexOfMutation(mutation)
                          ];
                        tmpPairing.mother.setSplitOrEF(mutationMother);
                        newPairing = new Pairing(
                          tmpPairing.father,
                          tmpPairing.mother
                        );
                        newPairing.optimationCount =
                          tmpPairing.optimationCount + 12;
                        tempRes.push(newPairing);
                      }
                    );

                    if (!optimal) {
                    }
                  });
                });
              }
            } else {
              res.forEach(function (pairing) {
                // wildtype x color || wildtype x DF
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationMother =
                  tmpPairing.mother.mutations[
                  tmpPairing.mother.getIndexOfMutation(mutation)
                  ];
                tmpPairing.mother.setColorOrDF(mutationMother);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 7;
                tempRes.push(newPairing);
                // color x wildtype || DF x wildtype
                tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                mutationFather =
                  tmpPairing.father.mutations[
                  tmpPairing.father.getIndexOfMutation(mutation)
                  ];
                tmpPairing.father.setColorOrDF(mutationFather);
                newPairing = new Pairing(tmpPairing.father, tmpPairing.mother);
                newPairing.optimationCount = tmpPairing.optimationCount + 5;
                tempRes.push(newPairing);
                if (mutation.getInheritanceMode() === "autosomal dominant") {
                  // wildtype x split || wildtype x EF
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount;
                  tempRes.push(newPairing);
                  // split x wildtype || EF x wildtype
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount;
                  tempRes.push(newPairing);
                  // split x split || EF x EF
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount;
                  tempRes.push(newPairing);
                }
                if (mutation.getInheritanceMode() !== "autosomal dominant") {
                  // split x color || EF x DF
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setSplitOrEF(mutationFather);
                  tmpPairing.mother.setColorOrDF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 3;
                  tempRes.push(newPairing);
                }
                if (
                  mutation.getInheritanceMode() !== "heterosomal recessive" &&
                  mutation.getInheritanceMode() !== "darkening factors" &&
                  mutation.getInheritanceMode() !== "autosomal dominant"
                ) {
                  // color x split || DF x EF
                  tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                  mutationFather =
                    tmpPairing.father.mutations[
                    tmpPairing.father.getIndexOfMutation(mutation)
                    ];
                  mutationMother =
                    tmpPairing.mother.mutations[
                    tmpPairing.mother.getIndexOfMutation(mutation)
                    ];
                  tmpPairing.father.setColorOrDF(mutationFather);
                  tmpPairing.mother.setSplitOrEF(mutationMother);
                  newPairing = new Pairing(
                    tmpPairing.father,
                    tmpPairing.mother
                  );
                  newPairing.optimationCount = tmpPairing.optimationCount + 1;
                  tempRes.push(newPairing);
                }
                if (!optimal) {
                  if (
                    mutation.getInheritanceMode() !== "heterosomal recessive" &&
                    mutation.getInheritanceMode() !== "darkening factors" &&
                    mutation.getInheritanceMode() !== "autosomal dominant"
                  ) {
                    // wildtype x split || wildtype x EF
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount = tmpPairing.optimationCount;
                    tempRes.push(newPairing);
                  }
                  if (mutation.getInheritanceMode() !== "autosomal dominant") {
                    // split x wildtype || EF x wildtype
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount = tmpPairing.optimationCount;
                    tempRes.push(newPairing);
                  }
                  if (
                    mutation.getInheritanceMode() !== "heterosomal recessive" &&
                    mutation.getInheritanceMode() !== "darkening factors" &&
                    mutation.getInheritanceMode() !== "autosomal dominant"
                  ) {
                    // split x split || EF x EF
                    tmpPairing = angular.copy(pairing); //deepCopy(pairing);
                    mutationFather =
                      tmpPairing.father.mutations[
                      tmpPairing.father.getIndexOfMutation(mutation)
                      ];
                    mutationMother =
                      tmpPairing.mother.mutations[
                      tmpPairing.mother.getIndexOfMutation(mutation)
                      ];
                    tmpPairing.father.setSplitOrEF(mutationFather);
                    tmpPairing.mother.setSplitOrEF(mutationMother);
                    newPairing = new Pairing(
                      tmpPairing.father,
                      tmpPairing.mother
                    );
                    newPairing.optimationCount = tmpPairing.optimationCount;
                    tempRes.push(newPairing);
                  }
                }
              });
            }

            res = tempRes;
          } else if (mutation.getName() === "gender_female") {
          }
        }
      });

      return mksort.sort(res, {
        optimationCount: "desc",
        offspringCount: "asc",
      });
    },
  };

  return ReverseGenCalcEngine;
});

app.factory("Allele", function () {
  function Allele(mutation) {
    this.mutation = mutation;
    this.mutated = false;
    this.isT1orT2 = false;
    this.probability = 1.0;
  }

  Allele.prototype = {
    getMutation: function () {
      return this.mutation;
    },

    getMutated: function () {
      return this.mutated;
    },

    getIsT1OrT2: function () {
      return this.isT1orT2;
    },

    getProbability: function () {
      return this.probability;
    },
  };

  Allele.fromMutationAndMutated = function (mutation, mutated) {
    var res = new Allele(mutation);
    res.mutated = mutated;
    return res;
  };

  return Allele;
});

app.factory("ResultList", function (Bird, ResultListItem) {
  function ResultList() {
    this.offspringCount = 0;
    this.offspringList = [];
  }

  ResultList.prototype = {
    getOffspringCount: function () {
      return this.offspringCount;
    },

    getOffspringList: function () {
      return this.offspringList;
    },

    findResultListItemByMutationFullName: function (mutationFullName) {
      var resResultListItem = null;

      if (this.offspringList.length > 0) {
        for (var i = 0; i < this.offspringList.length; i++) {
          if (this.offspringList[i].getMutationName() === mutationFullName) {
            resResultListItem = this.offspringList[i];
            break;
          }
        }
      }

      return resResultListItem;
    },

    findResultListItemByGenFormula: function (genFormula) {
      var resResultListItem = null;

      if (this.offspringList.length > 0) {
        for (var i = 0; i < this.offspringList.length; i++) {
          if (this.offspringList[i].getGenFormula() === genFormula) {
            resResultListItem = this.offspringList[i];
            break;
          }
        }
      }

      return resResultListItem;
    },

    AddBird: function (bird, offspringFactor) {
      var resultListItem = this.findResultListItemByMutationFullName(
        bird.getMutationFullName()
      );
      //var resultListItem = this.findResultListItemByGenFormula(bird.getGenFormula());

      if (resultListItem !== null) {
        resultListItem.mutationCount += 1;
        resultListItem.offspringFactor += offspringFactor;
      } else {
        this.offspringList.push(
          new ResultListItem(
            bird.getMutationFullName(),
            bird.getGenFormula(),
            this,
            offspringFactor
          )
        );
      }
      this.offspringCount += 1;
    },
  };

  return ResultList;
});

app.factory("ResultListItem", function () {
  function ResultListItem(mutationName, genFormula, owner, offspringFactor) {
    this.mutationName = mutationName;
    this.genFormula = genFormula;
    this.owner = owner;
    this.mutationCount = 1;
    this.offspringFactor = offspringFactor;
  }

  ResultListItem.prototype = {
    getMutationName: function () {
      return this.mutationName
        .replace("(Z1)", "")
        .replace("(Z2)", "")
        .replace(" (T2)", "")
        .replace(" (T2/T2)", "");
    },

    getGenFormula: function () {
      return this.genFormula;
    },

    getMutationCount: function () {
      return this.mutationCount;
    },

    getOffspringFactor: function () {
      return this.offspringFactor;
    },

    getOwner: function () {
      return this.owner;
    },

    getPercentText: function () {
      var res = "???";

      if (this.owner !== null) {
        //res = ((this.mutationCount * 100) / this.owner.getOffspringCount()).toFixed(2) + '%';
        //res = (this.getMutationCount() * this.getOffspringFactor() * 100).toFixed(2) + '%';
        res = (this.getOffspringFactor() * 100).toFixed(2) + "%";
      }

      return res;
    },
  };

  return ResultListItem;
});

app.factory("Pairing", function (GenCalcEngine) {
  function Pairing(father, mother) {
    this.father = father;
    this.mother = mother;
    this.optimationCount = 0;
    this.engine = new GenCalcEngine(this.father, this.mother);
    this.offspringCount =
      this.engine.CalcResults("male").getOffspringCount() +
      this.engine.CalcResults("female").getOffspringCount();
  }

  Pairing.prototype = {
    getFather: function () {
      return this.father;
    },

    getMother: function () {
      return this.mother;
    },

    getOptimationCount: function () {
      return this.optimationCount;
    },

    getOffspringCount: function () {
      return this.offspringCount;
    },

    getEngine: function () {
      return this.engine;
    },
  };

  return Pairing;
});

setTimeout(function () {
  let urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get("id");
  if (id) UpdateSpecies(id);
  else UpdateSpecies("ringneck");
}, 100);

//pass coleiro 
// if(document.location.href.includes("coleiro")) {
//   document.getElementById("lock").style.display = "none";
// }
document.getElementById("lock").style.display = "none";
// const keyList = [];
// document.querySelector("#lock form").addEventListener("submit", function () {
//   const userInput = document.getElementById("chave").value;
//   if (keyList.includes(userInput)) {
//     document.body.style.overflow = 'auto';
//     //document.body.style.overflowX = 'hidden';
//     document.getElementById("lock").style.display = "none";
//   } else {
//     document.querySelector("#lock .error").style.display = "block";
//     return false;
//   }
//   return false;
// });

// document.addEventListener('DOMContentLoaded', function() {
//   let sla = document.getElementById("btn_dd");
//   if(sla) sla.innerText = "D";
// });

document.body.style.overflow = 'hidden';

