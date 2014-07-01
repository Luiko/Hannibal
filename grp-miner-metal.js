/*jslint bitwise: true, browser: true, evil:true, devel: true, debug: true, nomen: true, plusplus: true, sloppy: true, vars: true, white: true, indent: 2 */
/*globals HANNIBAL, deb */

/*--------------- GROUP: M I N E R --------------------------------------------





  V: 0.1, agentx, CGN, Feb, 2014

*/


HANNIBAL = (function(H){

  H.Plugins = H.Plugins || {};

  H.extend(H.Plugins, {

    "g.miner-metal" : {

      /*
        a group without units solely for the first/biggest CC

        Behaviour: 
          to exploit resources like ruins, mines with stone
          to build a dropsite if needed
          
      */

      active:         true,           // prepared for init/launch ...
      description:    "miner",        // text field for humans 
      civilisations:  ["*"],          // 
      interval:       4,              // call onInterval every x ticks
      parent:         "",             // inherit useful features

      capabilities:   "2 stone/sec",  // (athen) give the economy a hint what this group provides.

      position:       null,           // refers to the coords of the group's position/activities
      structure:      [],             // still unkown resource, inits at game start

      units:          ["exclusive", "metal.ore GATHEREDBY SORT > rates.metal.ore"],
      dropsite:       ["shared",    "metal ACCEPTEDBY"],
      dropsites:      ["dynamic",   "metal ACCEPTEDBY INGAME"],

      targets:        [{generic: 'metal', specific: 'ore'}],

      mine:           null,

      attackLevel:    0,              // increases with every attack, halfs on interval
      needsRepair:   80,              // a health level (per cent)
      needsDefense:  10,              // an attack level

      listener: {

        onLaunch: function(ccid, mine){

          mine = mine || H.Scout.nearestResource(this.position, this.targets);

          deb("     G: onlaunch %s mine: %s", this, mine);

          if (mine){
            this.mine = mine;
            this.position = mine.position;
            this.register("units", "dropsite", "dropsites");
            this.economy.request(1, this.units, this.position);   
          }

        },
        onAssign: function(asset){

          deb("     G: %s onAssign ast: %s as '%s' res: %s", this, asset, asset.property, asset.resources[0]);
         
          if (this.units.match(asset)){

            deb("     G: onAssign position: %s", H.prettify(this.position));

            if (this.units.count === 1){
              if (this.dropsites.nearest(1).distanceTo(this.position) > 100){
                this.economy.request(1, this.dropsite, this.position); 
              }  
              this.economy.request(4, this.units, this.position);   
            }

            asset.gather(this.mine);

          } else if (this.dropsite.match(asset)){

            if (asset.isFoundation){this.units.repair(asset);}
            if (asset.isStructure){this.units.gather(this.mine);}

          }

        },
        onDestroy: function(asset){

          deb("     G: %s onDestroy: %s", this, asset);

          if (this.units.match(asset)){
            this.economy.request(1, this.units, this.position);

          } else if (this.dropsite.match(asset)){
            this.economy.request(1, this.dropsite, this.position);

          }

        },
        onAttack: function(asset, enemy, type, damage){

          deb("     G: %s onAttack %s by %s, damage: %s", this, asset, enemy, damage);

        },
        onBroadcast: function(){},
        onInterval:  function(){

          deb("     G: %s onInterval,  states: %s", this, H.prettify(this.units.states()));

          if (this.units.count){
            
            if (this.units.doing("idle").count === this.units.count){

              H.Scout.updateResources();
              this.mine = H.Scout.nearestResource(this.units.center, this.targets);
              
              if (this.mine){
                this.units.gather(this.mine);

              } else {
                this.units.release();
                this.dissolve();
                deb("      G: %s finished mining", this);
                return;

              }

            } else {
              this.units.doing("idle").gather(this.mine);

            }

          }

        }

      } // listener

    }

  });

return H; }(HANNIBAL));
