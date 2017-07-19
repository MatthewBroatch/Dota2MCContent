"use strict";

var abilityName = "";

function SetAbility( ability_name )
{
	abilityName = ability_name;
	$( "#AbilityImage" ).abilityname = abilityName;
}

function LearnAbility( )
{
	var player = Players.GetLocalPlayer();
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	GameEvents.SendCustomGameEventToServer( "learn_ability", { "player" : player, "unit" : queryUnit, "abilityName": abilityName } );
}

(function()
{
	$.GetContextPanel().SetAbility = SetAbility;
})();
