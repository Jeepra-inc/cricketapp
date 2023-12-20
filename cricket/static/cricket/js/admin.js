$(document).ready(function() {
    var teamSelect = $('#id_team');
    var matchSelect = $('#id_match');
    var bowlerSelect = $('#id_bowler');
    var strikeSelect = $('#id_strike');
    var nonStrikeSelect = $('#id_non_strike');

    // Function to fetch and populate bowlers
    function fetchAndPopulateBowlers(selectedMatch, selectedTeam) {
        $.ajax({
            url: '/cricket/get_bowlers/',
            data: { 'match': selectedMatch, 'team': selectedTeam },
            success: function(data) {
                bowlerSelect.empty();
                $.each(data, function(key, value) {
                    bowlerSelect.append($('<option>', {
                        value: key,
                        text: value
                    }));
                });
            }
        });
    }

    // When the team selection changes
    teamSelect.change(function() {
        var selectedMatch = matchSelect.val();
        var selectedTeam = $(this).val();
        if (selectedMatch && selectedTeam) {
            fetchAndPopulateBowlers(selectedMatch, selectedTeam);
        }
    });

    // When the match selection changes
    matchSelect.change(function() {
        var selectedMatch = $(this).val();
        if (selectedMatch) {
            // Fetch and populate teams
            fetchAndPopulateTeams(selectedMatch);
        }
    });

    // Function to fetch and populate teams based on the selected match
    function fetchAndPopulateTeams(selectedMatch) {
        $.ajax({
            url: '/cricket/get_teams/',
            data: { 'match': selectedMatch },
            success: function(data) {
                teamSelect.empty();
                $.each(data, function(key, value) {
                    teamSelect.append($('<option>', {
                        value: key,
                        text: value
                    }));
                });

                // When the teams are populated, trigger a change event on the teamSelect
                teamSelect.change();
            }
        });
    }

    // Trigger the change event when the page loads
    var selectedMatch = matchSelect.val();
    if (selectedMatch) {
        // Fetch and populate teams
        fetchAndPopulateTeams(selectedMatch);
    }


    // Function to populate players for "Strike" and "Non Strike" when adding a new LiveScore
    function populatePlayers(selectedTeam) {
        // Clear existing options in both select elements
        strikeSelect.empty();
        nonStrikeSelect.empty();

        // Add a default option with an empty value
        strikeSelect.append($('<option>', {
            value: '',
            text: '---------'
        }));

        nonStrikeSelect.append($('<option>', {
            value: '',
            text: '---------'
        }));

        // Fetch and populate player data via AJAX
        $.ajax({
            url: '/cricket/get_players/',
            data: { 'team': selectedTeam },
            success: function(data) {
                $.each(data, function(key, value) {
                    strikeSelect.append($('<option>', {
                        value: key,
                        text: value
                    }));

                    nonStrikeSelect.append($('<option>', {
                        value: key,
                        text: value
                    }));
                });
            }
        });
    }

    // Check if we are adding a new LiveScore (URL contains 'add')
    var isAddingLiveScore = window.location.href.indexOf('/add/') > -1;

    if (isAddingLiveScore) {
        // Trigger the change event when the page loads
        var selectedTeam = teamSelect.val();
        if (selectedTeam) {
            populatePlayers(selectedTeam);
        }

        // When the team selection changes
        teamSelect.change(function() {
            var selectedTeam = $(this).val();
            if (selectedTeam) {
                populatePlayers(selectedTeam);
            }
        });
    }


    // Check if we are editing an existing LiveScore (URL contains 'change')
    var isEditingLiveScore = window.location.href.indexOf('/change/') > -1;

    if (isEditingLiveScore) {
        // Get the "Match" and "Team" select fields
        var matchSelect = $('#id_match');
        var teamSelect = $('#id_team');
        var strikeSelect = $('#id_strike');
        var nonStrikeSelect = $('#id_non_strike');

        // Disable the "Match" and "Team" select fields
        matchSelect.prop('disabled', true);
        teamSelect.prop('disabled', true);
        // Disable the "Strike" and "Non Strike" select fields
        strikeSelect.prop('disabled', true);
        nonStrikeSelect.prop('disabled', true);
    }
});
