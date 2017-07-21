//Runs a function periodically
//start - how much of an additional delay to have (on top of the tick refresh) (set this to -1 to run the function immediately
//time - how long to run for. set this to -1 to run infinitely
//tick - how many seconds to elapse between ticks (assumes time / tick is an integer) (set this to negative to run a set amount of ticks, e.g. -30 will run 30 ticks in whatever time period given)
//func - func to run (return true to cancel)
//UPDATE June 29 2015 - fixed some enclosure issues, added a safecheck for time overflow
$.Every = function(start, time, tick, func){
    var startTime = Game.Time();
    var tickRate = tick;
    if(tick <= 0){
        if(start < 0) tick--;
        tickRate = time / -tick;
    }

    var tickCount =  time/ tickRate;

    if(time < 0){
        tickCount = 9999999;
    }
    var numRan = 0;
    $.Schedule(start, (function(start,numRan,tickRate,tickCount){
        return function(){
            if(start < 0){
                start = 0;
                if(func()){
                    return;
                }; 
            }  
            var tickNew = function(){
                numRan++;
                delay = (startTime+tickRate*numRan)-Game.Time();
                if((startTime+tickRate*numRan)-Game.Time() < 0){
                    // $.Msg('[ERROR] Function ' + func + ' taking too long to loop!')
                    delay = 0;
                }
                $.Schedule(delay, function(){
                    if(func()){
                        return;
                    };
                    tickCount--;
                    if(tickCount > 0) tickNew();
                });
            };
            tickNew();
        }
    })(start,numRan,tickRate,tickCount));
};

function OnLevelUpClicked(stat)
{
    var queryUnit = Players.GetLocalPlayerPortraitUnit();
    $.Msg("increase_hero_stat");
    GameEvents.SendCustomGameEventToServer( "increase_hero_stat", { "hero" : queryUnit, "stat" : stat } );
    CheckAbilityPointsState();
}

function CheckAbilityPointsState()
{
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
    if (Entities.GetAbilityPoints( queryUnit ) <= 0) {
        $( "#LevelUpStrButton" ).RemoveClass( "could_level_up" )
        $( "#LevelUpDexButton" ).RemoveClass( "could_level_up" )
        $( "#LevelUpIntButton" ).RemoveClass( "could_level_up" )
    } else {
        $( "#LevelUpStrButton" ).AddClass( "could_level_up" )
        $( "#LevelUpDexButton" ).AddClass( "could_level_up" )
        $( "#LevelUpIntButton" ).AddClass( "could_level_up" )
    }
}

function UpdateHealthAndMana()
{
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	var container = $( "#health-and-mana" );
	if ( !container )
		return;
	$( "#health-percent" ).style.width = (Entities.GetHealth( queryUnit ) / Entities.GetMaxHealth( queryUnit ) * 100) + "%";
	$( "#mana-percent" ).style.width = (Entities.GetMana( queryUnit ) / Entities.GetMaxMana( queryUnit ) * 100) + "%";
	$( "#health-regen" ).text = "+" + Math.round(Entities.GetHealthThinkRegen( queryUnit ) * 10) / 10;
    $( "#mana-regen" ).text = "+" + Math.round(Entities.GetManaThinkRegen( queryUnit ) * 10) / 10;
	$( "#health-total" ).text = Entities.GetHealth( queryUnit ) + "/" + Entities.GetMaxHealth( queryUnit );
	$( "#mana-total" ).text = Entities.GetMana( queryUnit ) + "/" + Entities.GetMaxMana( queryUnit );
	$( "#damage-label" ).text = (Entities.GetDamageMax( queryUnit ) + Entities.GetDamageMin( queryUnit )) / 2 + Entities.GetDamageBonus( queryUnit );
	$( "#armor-label" ).text = Math.round((Entities.GetPhysicalArmorValue( queryUnit ) + Entities.GetBonusPhysicalArmor( queryUnit )) * 10) / 10;
	$( "#movespeed-label" ).text = Entities.GetBaseMoveSpeed( queryUnit );
}

function SendMeStats() {
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
    var player = Players.GetLocalPlayer()
    GameEvents.SendCustomGameEventToServer( "get_unit_stats", { "player" : player, "unit" : queryUnit } );
}

function GetMeStats( event_data )
{
    if (event_data.str) {
        $( "#strength-label" ).text = event_data.str;
        $( "#agility-label" ).text = event_data.agi;
        $( "#intelligence-label" ).text = event_data.int;
    }
    else {
        $( "#strength-label" ).text = "-";
        $( "#agility-label" ).text = "-";
        $( "#intelligence-label" ).text = "-";
    }
}
 

(function()
{
  // $.RegisterForUnhandledEvent( "DOTAAbility_LearnModeToggled", OnAbilityLearnModeToggled);

	GameEvents.Subscribe( "dota_player_update_selected_unit", UpdateHealthAndMana );
    GameEvents.Subscribe( "dota_player_update_selected_unit", SendMeStats );
    GameEvents.Subscribe( "dota_inventory_changed", SendMeStats );
	GameEvents.Subscribe( "dota_inventory_item_changed", SendMeStats );
    GameEvents.Subscribe( "send_player_stats", GetMeStats);
	// GameEvents.Subscribe( "dota_player_update_selected_unit", UpdateAbilityList );
	// GameEvents.Subscribe( "dota_player_update_query_unit", UpdateAbilityList );
	// GameEvents.Subscribe( "dota_ability_changed", UpdateAbilityList );
	GameEvents.Subscribe( "dota_hero_ability_points_changed", CheckAbilityPointsState );
    
    SendMeStats();
    CheckAbilityPointsState();

	$.Every(0, -1, 0.33,  function() { UpdateHealthAndMana() }, 100); // initial update
})();