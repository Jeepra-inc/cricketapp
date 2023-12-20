$(document).ready(function () {
    var form = $('#liveScoreForm');
        id_bowler = $('.bowler');
        strikeDropdown = $('#strikeDropdown');
        nonstrikeDropdown = $('#nonstrikeDropdown')
        bowlerDropdown = $('#id_bowler');
        teamInput = $('#liveScoreForm').data('batting');
        $('.select').select2();
    function fetchAndPopulatePlayers() {
        $.ajax({
            url: '/cricket/get_players/',
            data: { 'team': oppositeTeam },
            success: function (data) {

                $('#additionalDropdown').append($('<option>', {
                    value: '',
                    text: 'Select Player'
                }));

                $.each(data, function (key, value) {
                    strikeDropdown.append($('<option>', {
                        value: key,
                        text: value
                    }));

                    nonstrikeDropdown.append($('<option>', {
                        value: key,
                        text: value
                    }));

                    $('#additionalDropdown').append($('<option>', {
                        value: key,
                        text: value
                    }));
                });

                strikeDropdown.val(defaultStrike);
                nonstrikeDropdown.val(defaultNonStrike);
            }
        });            
    }
    function getMatchIdFromUrlInning() {
        var currentUrl = window.location.href;
        var matchIdMatch = currentUrl.match(/\/cricket\/update_inning\/(\d+)\/$/);
        if (matchIdMatch && matchIdMatch.length === 2) {
            return parseInt(matchIdMatch[1], 10);
        } else {
            return null;
        }
    }

    // Function to fetch and populate teams based on the selected match
    function fetchAndPopulateTeams() {
        $.ajax({
            url: '/cricket/get_teams/',
            data: { 'match': selectedMatch },
            success: function (data) {
                if ('batting_team' in data) {
                    // var battingTeamName = data.batting_team;
                    // battingTeamActive.text(battingTeamName)
                    var battingTeam = data.batting_team_id;
                    // teamInput.val(battingTeam);
                    form.attr('data-team', battingTeam);
                } else {
                    console.error('Error: batting_team not found in the response');
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.error('Error fetching team data:', thrownError);
            }
        });
    }



    // Function to fetch and populate bowlers based on the selected team
    function fetchAndPopulateBowlers() {
        setTimeout(function() {
            $.ajax({
                url: '/cricket/get_bowlers/', 
                data: { 'team': selectedTeam },
                success: function (data) {
                    id_bowler.empty();
                    $.each(data, function (key, value) {
                        id_bowler.append($('<option>', {
                            value: key,
                            text: value
                        }));
                    });

                    // Set the default selected bowler in the dropdown
                    if (defaultBowlerId) {
                        id_bowler.val(defaultBowlerId);
                    }
                }
            });
        }, 10);
    }

    fetchAndPopulatePlayers();
    fetchAndPopulateBowlers();
    fetchAndPopulateTeams();

$('.updateInningForm').submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var formData = {
        strike: $('#strikeDropdown').val(),
        non_strike: $('#nonstrikeDropdown').val(),
        bowler: $('#id_bowler').val(),
        batting_team: oppositeTeam,
        inning: $('#liveScoreForm').data('inning'),
        csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val(),
    };

    $.ajax({
      type: form.attr('method'),
      url: '/cricket/update_inning/'+selectedMatch+'/', 
      data: formData,
      success: function(data) {
        if (data.success) {
            localStorage.setItem('strikePlayer', $('#strikeDropdown').val());
            localStorage.setItem('nonStrikePlayer', $('#nonstrikeDropdown').val());
            var newUrl = '/cricket/manage_scores/' + getMatchIdFromUrlInning() + '/';
            window.location.replace(newUrl);
            return; // Stop further execution, no need to proceed with AJAX call
        } else {
            // Handle errors if needed
            $('#resultMessage').html('<p>Update failed. Please check the form.</p>');
        }
    },
      error: function() {
        $('#resultMessage').html('<p>Update failed. Please try again later.</p>');
      }
    });
  });























});

