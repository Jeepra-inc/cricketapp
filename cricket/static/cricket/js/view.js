$(document).ready(function () {
    var form = $('#liveScoreForm');
        id_bowler = $('.bowler');
        strikeDropdown = $('#strikeDropdown');
        nonstrikeDropdown = $('#nonstrikeDropdown')
        bowlerDropdown = $('#id_bowler');
        teamInput = $('#liveScoreForm').data('batting');
        $('.select').select2();


    
    /**
     * Strike and non strike players information
     *  */
    // Fetch and populate batting team players for strike, non-strike and out player replaced by fields
    function fetchAndPopulatePlayers() {
        var selectedTeam = $('#liveScoreForm').data('batting');

        $.ajax({
            url: '/cricket/get_players/',
            data: { 'team': selectedTeam },
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


    // Function to fetch and populate player scoreboard based on player ID for strike player
    function fetchAndPopulatePlayerScoreBoard(playerId, prefix) {
        // Reset totalRuns to 0 each time the function is called
        totalRuns = 0;
        $.ajax({
            url: '/cricket/get_admin_player_scoreboard/' + getMatchIdFromUrl() + '/',
            data: { 'player_id': playerId },  // Pass the player ID as part of the request data
            success: function (data) {
                // Check if the response contains player_scoreboard_data
                if ('player_scoreboard_data' in data) {
                    var playerScoreboardData = data.player_scoreboard_data;

                    console.log('Player ID within success callback:', playerId);


                    $('.' + prefix + '-totalRuns').text(playerScoreboardData[0].totalRuns);
                    $('.' + prefix + '-totalBalls').text(playerScoreboardData[0].totalBalls);
                    $('.' + prefix + '-total4s').text(playerScoreboardData[0].total4s);
                    $('.' + prefix + '-total6s').text(playerScoreboardData[0].total6s);
                    $('.' + prefix + '-strikeRate').text(playerScoreboardData[0].strikeRate);
                    $('.' + prefix + '-id').attr('data-id', playerId);

                    totalRuns = parseInt(playerScoreboardData[0].totalRuns, 10);
                    $('.totalRuns').text(totalRuns);

                } else {
                    console.error('Error: player_scoreboard_data not found in the response');
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                // Handle errors
                console.error('Error fetching player scoreboard data:', thrownError);
            }
        });
    }



    // Set the player IDs based on your logic (e.g., a variable, user input, etc.)
    var strikePlayerId = ''; 
    var nonStrikePlayerId = ''; 

    // Event listener for the "Strike Player" dropdown change event
    strikeDropdown.on('change', function() {
        var selectedStrikePlayerId = $(this).val();
        strikePlayerId = selectedStrikePlayerId;
        fetchAndPopulatePlayerScoreBoard(strikePlayerId, 'sp');
    });

    // Event listener for the "Non-Strike Player" dropdown change event
    nonstrikeDropdown.on('change', function() {
        var selectedNonStrikePlayerId = $(this).val();
        nonStrikePlayerId = selectedNonStrikePlayerId;
        fetchAndPopulatePlayerScoreBoard(nonStrikePlayerId, 'nsp');
    });

    // Event listener for the "Strike Player" dropdown change event
    bowlerDropdown.on('change', function() {
        var bowlerPlayerID = $(this).val();
        bowlerPlayerId = bowlerPlayerID;
        bowlerScoreboardStats(bowlerPlayerId);
    });

    function strikeNonstrikePlayerScoreboard() {
        var selectedStrikePlayerId = $(strikeDropdown).val();
        strikePlayerId = selectedStrikePlayerId;
        fetchAndPopulatePlayerScoreBoard(strikePlayerId, 'sp');

        var selectedNonStrikePlayerId = $(nonstrikeDropdown).val();
        nonStrikePlayerId = selectedNonStrikePlayerId;
        fetchAndPopulatePlayerScoreBoard(nonStrikePlayerId, 'nsp');

        var bowlerPlayerID = $(bowlerDropdown).val();
        bowlerPlayerId = bowlerPlayerID;
        bowlerScoreboardStats(bowlerPlayerId);        
    }



    // Function to fetch and populate bowlers based on the selected team
    function fetchAndPopulateBowlers() {
        setTimeout(function() {
            $.ajax({
                url: '/cricket/get_bowlers/', 
                data: { 'team': oppositeTeam },
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

    //Get bowler stats based on selected bowler ID
    function bowlerScoreboardStats(bowlerID) {
        var matchId = getMatchIdFromUrl();
        $.ajax({
            url: '/cricket/get_bowler_admin_stats/' + matchId + '/',
            data: { 'bowler_id': bowlerID },
            success: function (data) {
                if ('bowlers_info' in data) {
                    var bowlerStats = data.bowlers_info[0];
                    console.log(bowlerStats);

                    // Update elements with specific classes using the provided prefix
                    $('.bp-totalOvers').text(bowlerStats.overs);
                    $('.bp-runSpent').text(bowlerStats.runs_given);
                    $('.bp-wicketTaken').text(bowlerStats.wickets_taken);
                    $('.bp-economy').text(bowlerStats.wickets_taken);

                    // Display runs entries in ascending order of timestamp
                    var runsEntries = bowlerStats.runs_entries.sort(function(a, b) {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    });

                    // Group runs entries into overs (6 entries per over)
                    var overs = [];
                    var currentOver = [];

                    for (var i = 0; i < runsEntries.length; i++) {
                        var entry = runsEntries[i];
                        
                        currentOver.push(entry);

                        // Check if the current over is complete
                        var isOverComplete = currentOver.length === 6;

                        if (isOverComplete) {
                            overs.push(currentOver);
                            currentOver = [];
                        }
                    }

                    // Counter for maiden overs
                    var maidenOverCount = 0;

                    // Process each over and display
                    // Process each over and display
                    for (var j = 0; j < overs.length; j++) {
                        var over = overs[j];
                        console.log('Over', j + 1, over);

                        var overText = `Over ${j + 1}: `;
                        var legalBalls = 0;
                        var maidenOver = true;

                        for (var k = 0; k < over.length; k++) {
                            var runEntry = over[k];
                            overText += `Runs - ${runEntry.runs}`;
                            if (runEntry.extras) {
                                overText += `, Extras - ${runEntry.extras}`;
                            }

                            legalBalls++;  // Count all entries as legal balls

                            // Check if the runEntry has non-zero runs, if yes, it's not a maiden over
                            if (runEntry.runs !== 0) {
                                maidenOver = false;
                            }
                        }

                        overText += ` (${legalBalls} legal balls)`;

                        if (maidenOver) {
                            maidenOverCount++;
                            overText += ' (Maiden Over)';
                        }

                        $('.bp-test').append('<li>' + overText + '</li>');
                        // Calculate and display the bowler's economy
                        var totalRunsGiven = bowlerStats.runs_given;
                        var totalOversBowled = bowlerStats.overs;
                        var bowlerEconomy = totalRunsGiven / totalOversBowled;
                        $('.bp-economy').text(bowlerEconomy.toFixed(2));
                    }


                    // Show total number of maiden overs after processing all overs
                    // alert('Total Maiden Overs: ' + maidenOverCount);
                    $('.bp-maiden').text(maidenOverCount);

                } else {
                    console.error('Error: bowlers_info not found in the response');
                }
            },
            error: function (error) {
                console.error('Error fetching bowlers\' information:', error);
            }
        });
    }

    


    // Function to extract match ID from the current URL
    function getMatchIdFromUrl() {
        var currentUrl = window.location.href;
        var matchIdMatch = currentUrl.match(/\/cricket\/manage_scores\/(\d+)\/$/);
        if (matchIdMatch && matchIdMatch.length === 2) {
            return parseInt(matchIdMatch[1], 10);
        } else {
            return null;
        }
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

    


    // function fetchAndDisplayBowlersInfo() {
    //     var matchId = getMatchIdFromUrl();
    //     $.ajax({
    //         url: '/cricket/get_bowler_info/' + matchId + '/',
    //         success: function (data) {

    //             var bowlersInfoList = $('#bowlersInfoList');
                

    //             // Clear the existing list
    //             bowlersInfoList.empty();
    //             // Display the list of bowlers' information
    //             $.each(data.bowlers_info, function (index, bowler) {
    //                 var overs = Math.floor(bowler.legal_balls / 6) + ((bowler.legal_balls % 6) / 10); 
    //                 var row = $('<tr></tr>');
    //                 row.append('<td>' + bowler.bowler_name + '</td>');
    //                 row.append('<td>' + overs.toFixed(1) + '</td>');
    //                 row.append('<td>' + bowler.total_runs_given + '</td>');
    //                 row.append('<td>' + bowler.wickets_taken + '</td>');
    //                 bowlersInfoList.append(row);
    //             });
    //         },
    //         error: function (error) {
    //             console.error('Error fetching bowlers\' information:', error);
    //         }
    //     });
    // }
// // #nish
// function fetchAndDisplayBowlersInfo() {
//     var matchId = getMatchIdFromUrl();
//     $.ajax({
//         url: '/cricket/get_bowler_info/' + matchId + '/',
//         success: function (data) {
//             var bowlersInfoList = $('#bowlersInfoList');
//             // Declare maidenOverCount outside the $.each loop
//             var maidenOverCount = 0;

//             // Process each bowler's information
//             $.each(data.bowlers_info, function (index, bowler) {
//                 var runsEntries = bowler.runs_list;

//                 // Display runs entries in ascending order of timestamp
//                 runsEntries.sort(function(a, b) {
//                     return new Date(a.timestamp) - new Date(b.timestamp);
//                 });

//                 // Group runs entries into overs (6 entries per over)
//                 var overs = [];
//                 var currentOver = [];

//                 for (var i = 0; i < runsEntries.length; i++) {
//                     var entry = runsEntries[i];
//                     currentOver.push(entry);

//                     // Check if the current over is complete
//                     var isOverComplete = currentOver.length === 6;

//                     if (isOverComplete) {
//                         overs.push(currentOver);
//                         currentOver = [];
//                     }
//                 }

//                 // Process each over and display
//                 for (var j = 0; j < overs.length; j++) {
//                     var over = overs[j];
//                     var overText = `Over ${j + 1}: `;
//                     var legalBalls = 0;
//                     var maidenOver = true;

//                     for (var k = 0; k < over.length; k++) {
//                         var runEntry = over[k];
//                         overText += `Runs - ${runEntry.runs}`;
//                         if (runEntry.extras) {
//                             overText += `, Extras - ${runEntry.extras}`;
//                         }

//                         legalBalls++;  // Count all entries as legal balls

//                         // Check if the runEntry has non-zero runs, if yes, it's not a maiden over
//                         if (runEntry.runs !== 0) {
//                             maidenOver = false;
//                         }
//                     }

//                     overText += ` (${legalBalls} legal balls)`;

//                     if (maidenOver) {
//                         maidenOverCount++;
//                         overText += ' (Maiden Over)';
//                     }
//                 }

//                 // Append the bowler's information to the list
//                 var row = $('<tr></tr>');
//                 row.append('<td>' + bowler.bowler_name + '</td>');
//                 row.append('<td>' + bowler.total_overs + '</td>');
//                 row.append('<td>' + bowler.total_runs_given + '</td>');
//                 row.append('<td>' + bowler.wickets_taken + '</td>');
//                 row.append('<td>' + maidenOverCount + '</td>');
//                 row.append('<td>' + (bowler.total_runs_given / bowler.total_overs ).toFixed(2) + '</td>');
//                 bowlersInfoList.append(row);
//             });

//             // Show total number of maiden overs after processing all overs
//             console.log('Total Maiden Overs: ' + maidenOverCount);
//         },
//         error: function (error) {
//             // alert('not working')
//             console.error('Error fetching bowlers\' information:', error);
//         }
//     });
// }


// fetchAndDisplayBowlersInfo();


































    function fetchAndDisplayLiveScoresForMatch() {
        var matchId = getMatchIdFromUrl();
        var djangoAdminURL = '/admin/cricket/livescore/';

        var totalRunsPerOver = {};
    
        $.ajax({
            url: '/cricket/get_live_scores_for_match/' + matchId + '/',
            success: function (data) {
                if ('live_scores_for_match' in data) {
                    var liveScoresForMatch = data.live_scores_for_match;
                    var liveScoresList = $('#liveScoresList');
    
                    liveScoresList.empty();
    
                    var legitimateBallCount = 0;
                    var currentOver = 1;
    
                    // Reverse loop to display entries from newest to oldest
                    for (var i = liveScoresForMatch.length - 1; i >= 0; i--) {
                        var liveScoreData = liveScoresForMatch[i];
    
                        // Check if a new over has started
                        if (legitimateBallCount >= 6) {
                            // Add a title for the over
                            liveScoresList.prepend('<h5 class="bg-secondary text-white p-2">End of Over ' + currentOver + ' <br>' + totalRunsPerOver[currentOver] + ' runs</h5>');    
                            // Close the current <ul> element after each set of six 'no_extra' entries
                            liveScoresList.prepend('</ul>');
    
                            legitimateBallCount = 0;
                            currentOver++;
                            
                        }

                         // Check if wicket is "not_out" before including it in the output
                        var wicketInfo = '';
                        var extraInfo = '';
                        var colorClass = '';
                        var narration = '';
                        if (liveScoreData.wicket && liveScoreData.wicket.toLowerCase() !== 'not_out') {
                            wicketInfo = 'W';
                            colorClass = 'wicketColor';
                            liveScoreData.runs = ''
                        }
                        if (liveScoreData.extras && liveScoreData.extras.toLowerCase() !== 'no_extra') {
                            extraInfo = liveScoreData.extras;
                        }

                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'wide' )) {
                            liveScoreData.runs = '';
                            extraInfo = '<span class="esi"><span>WD</span></span>';
                            colorClass = 'extraColor';
                        }

                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'wide_run')) {
                            extraInfo = '<span class="esi"><span>WD</span><span>+R</span></span></span>';
                            colorClass = 'extraColor';
                        }

                        if (liveScoreData.extras && liveScoreData.extras.toLowerCase() === 'byes') {
                            extraInfo = '<span class="esi"><span>B</span></span>';
                            colorClass = 'extraColor';
                        }

                        if (liveScoreData.extras && liveScoreData.extras.toLowerCase() === 'leg_byes') {
                            extraInfo = '<span class="esi"><span>LB</span></span>';
                            colorClass = 'extraColor';
                        }

                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'no_ball' || liveScoreData.extras.toLowerCase() === 'no_ball_runs')) {
                            extraInfo = '<span class="esi"><span>NB</span></span>';
                            colorClass = 'extraColor';
                        }
                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'no_ball_byes')) {
                            extraInfo = '<span class="esi"><span>NB</span><span>+B</span></span>';
                            colorClass = 'extraColor';
                        }
                        
                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'no_ball_lb')) {
                            extraInfo = '<span class="esi"><span>NB</span><span>+LB</span></span>';
                            colorClass = 'extraColor';
                        }

                        if (liveScoreData.extras && (liveScoreData.extras.toLowerCase() === 'penalty_runs')) {
                            extraInfo = '<span class="esi"><span>PR</span></span>';
                            colorClass = 'extraColor';
                        }

                        // if (liveScoreData.wicket  && liveScoreData.wicket.toLowerCase() !== 'not_out') {
                        //     narration = liveScoreData.strike_player_name + ' is out by ' + liveScoreData.wicket ;
                        // }
                        if (liveScoreData.runs && (liveScoreData.extras.toLowerCase() === 'penalty_runs')){
                                narration = '<b>' + liveScoreData.runs + '</b>' + ' extra runs as <b>PR</b> by ' + liveScoreData.bowler;
                        }
                            else if (liveScoreData.runs === 0 && liveScoreData.extras !== 'leg_byes'){
                                narration = 'No Runs'
                            }
                            else if (liveScoreData.runs && liveScoreData.extras === 'no_extra') {
                                narration = liveScoreData.strike_player_name + ' made ' + liveScoreData.runs + ' runs';
                            }

                        if (liveScoreData.extras === 'wide') {
                                narration = '<b>WD</b> ball delivered by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.extras === 'wide_run') {
                                narration = '<b>WD</b> ball delivered by '+ liveScoreData.bowler +  ' with ' + '<b>' + liveScoreData.runs + '</b>' + ' extra runs';
                            }
                            else if (liveScoreData.extras === 'byes') {
                                narration = '<b>' +liveScoreData.runs + '</b>' + ' extra runs ' + ' thorugh <b>Byes</b>';
                            }
                            else if (liveScoreData.extras === 'leg_byes') {
                                narration = '<b>' +liveScoreData.runs + '</b>' + ' extra runs ' + ' thorugh <b>LB</b>';
                            }
                            else if (liveScoreData.extras === 'no_ball') {
                                narration = '<b>No Ball</b> delivered by '+ liveScoreData.bowler + ' with extra ' + '<b>' + liveScoreData.runs + '</b>' + ' runs';
                            }
                            else if (liveScoreData.extras === 'no_ball_byes') {
                                narration = '<b>' + liveScoreData.runs + '</b>' +  ' extra runs as <b>NB + B</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.extras === 'no_ball_lb') {
                                narration = '<b>' + liveScoreData.runs + '</b>' +  ' extra runs as <b>NB + LB</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.extras === 'no_ball_runs') {
                                narration = '<b>' + liveScoreData.runs + '</b>' +  ' extra runs as <b>NB + R</b> by '+ liveScoreData.bowler;
                            }
                        
                        if (liveScoreData.wicket === 'bowled_out') { 
                            narration = liveScoreData.wicket_out_player_name +  ' <b>Bowled Out</b> by '+ liveScoreData.bowler;
                        } 
                            else if (liveScoreData.wicket === 'caught_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Caught Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'leg_before_wicket') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>LBW</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'run_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Run Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'stumped_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Stumped Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'hit_wicket') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Hit Wicket Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'retired_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Retired Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'timed_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Timed Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'hit_the_ball_twice') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Hit the ball twice Out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'obstructing_the_field') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Obstructing the field out</b> by '+ liveScoreData.bowler;
                            }
                            else if (liveScoreData.wicket === 'retired_not_out') {  
                                narration = liveScoreData.wicket_out_player_name +  ' <b>Retired Out</b> by '+ liveScoreData.bowler;
                            }


                        liveScoresList.prepend(
                                '<div class="run-item d-flex border-bottom pb-2 mb-2 align-items-center mx-3">' +
                                '<div class="per-ball text-center d-flex align-items-center" style="height: 40px; width: 40px;">' +
                                    (liveScoreData.wicket && liveScoreData.wicket.toLowerCase() !== 'not_out' || liveScoreData.extras && liveScoreData.extras.toLowerCase() !== 'no_extra'
                                        ? ''
                                        : '0.' + (legitimateBallCount + 1)
                                    ) +
                                '</div>' + 
                                    '<div class="ball-status shadow-sm border rounded-circle d-flex align-middle align-items-center justify-content-center ' + colorClass + '" style="height: 40px; width: 40px;">' + liveScoreData.runs + extraInfo + wicketInfo + '</div>' +
                                    '<div class="ball-overview col-9 ps-3">' +
                                        '<div class="overview-title"><strong>' + liveScoreData.bowler + ' to ' + liveScoreData.strike_player_name + '</strong></div>' +
                                        // '<div class="overview-narration">' + liveScoreData.strike_player_name + ' made ' + liveScoreData.runs + ' runs</div>' +
                                        '<div class="overview-narration">' + narration + '</div>' +
                                    '</div>' +
                                    '<div class="edit-entry pe-3"><a href="' + djangoAdminURL + liveScoreData.id + '/change/" target="_blank">' + editIcon + '</a></div>' +
                                '</div>'
                        );
                        if (liveScoreData.extras == 'no_extra') {
                            legitimateBallCount++;
                        }

                        totalRunsPerOver[currentOver] = (totalRunsPerOver[currentOver] || 0) + parseInt(liveScoreData.runs || 0);

                    }
                    // console.log(inning)
                    //setup inning change
                    if (legitimateBallCount > 4 && inning === "1" && (currentOver === 1 && matchFormat === "T20" ) || legitimateBallCount > 4  && inning === "1" && (currentOver === 1 && matchFormat === "ODI")) {
                        // console.log(matchFormat)
                        // alert('inning end')
                        // $('#liveScoreForm').find('[name=inning]').val('3');
                        $('#liveScoreForm').attr('data-inning', '3');
                    }
                    // Add a title for the last over if there are remaining entries
                    if (legitimateBallCount > 0) {
                        liveScoresList.prepend('<h5 class="bg-primary text-white p-2"  data-over="'+currentOver + '.' +
                        (liveScoreData.extras && liveScoreData.extras.toLowerCase() !== "no_extra"
                                ? ""
                                : '' + (legitimateBallCount)
                            )
                        +'">Over ' + currentOver + ' - Total Runs: ' + totalRunsPerOver[currentOver] +  '</h5>');
                        $('#id_bowler').next().find('.select2-selection--single').removeClass('selectFocusChange');
                        $('.bowler-notice').remove();
                    }
                    if (legitimateBallCount > 5) { 
                        var selectedBowler = $('#id_bowler').val();
                        // alert('done');
                        // Check if the selected bowler matches the one stored in localStorage
                        var storedBowler = localStorage.getItem('currentBowler');
                        if (selectedBowler == storedBowler) {
                            // Display an alert message
                            
                            $('#submitScoreButton').prop('disabled', true);
                            $('<div class="alert alert-warning py-1 px-3 bowler-notice">Please Change the Bowler</div>').insertBefore('.bowling-player-stats');
                            $('#id_bowler').next().find('.select2-selection--single').addClass('selectFocusChange');
                            return; // Exit the function, do not proceed with form submission
                        } else {
                            $('#id_bowler').next().find('.select2-selection--single').removeClass('selectFocusChange');
                            $('.bowler-notice').remove();

                        }

                    }
                } else {
                    console.error('Error: live_scores_for_match not found in the response');
                }
                var staticOver = $('#liveScoresList > h5').data('over');
                form.attr('data-over', staticOver);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.error('Error fetching live scores for the match:', thrownError);
            }
        });
    }

// Usage of the Promise
fetchAndDisplayLiveScoresForMatch()






    setTimeout(function () {
        // Function to show selected options for the bowler select
        function showBowlerOptions() {
            var selectedBowler = $('#id_bowler').val();

            // Remove all options in id_wicket_by
            $('#id_wicket_by option').remove();

            // Add options from id_bowler to id_wicket_by
            $('#id_bowler option').each(function() {
                var bowlerValue = $(this).val();
                var bowlerText = $(this).text();
                $('#id_wicket_by').append($('<option>', {
                    value: bowlerValue,
                    text: bowlerText
                }));
            });
        }

        // Attach the function to the change event of the bowler select
        $('#id_bowler').on('change', showBowlerOptions);

        // Initial call to show options based on the initial value of the bowler select
        showBowlerOptions();
    }, 600);


    // Call this function with the desired match ID
    setTimeout(function() {
        fetchAndPopulateBowlers();
        fetchAndPopulatePlayers();
        fetchAndPopulateSelectedPlayersDropdown();  
    }, 100);

    fetchAndPopulateTeams();
    // fetchLiveScoreData(1); 
    
    // Call the function to fetch and display bowlers' information
    // Call the function when the page loads

   
    



// Function to fetch and populate player scoreboard based on player ID
function battingTeamSummary() {
    // Reset totalRuns to 0 each time the function is called
    totalRuns = 0;

    // Make an AJAX request to fetch player scoreboard data
    $.ajax({
        url: '/cricket/batting_team_summary/' + getMatchIdFromUrl() + '/',
        success: function (data) {
            // Check if the response contains player_scoreboard_data
            if ('batting_team_summary_data' in data) {
                var playerScoreboardData = data.batting_team_summary_data;
                $('.team-run').text(playerScoreboardData[0].totalRuns);

            } else {
                console.error('Error: player_scoreboard_data not found in the response');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching player scoreboard data:', thrownError);
        }
    });
}
battingTeamSummary();











setTimeout(function() {
    strikeNonstrikePlayerScoreboard();
}, 500);


// $('input[name="runs"]').change(function () {
//     var selectedRun = parseInt($('input[name="runs"]:checked').val(), 10);

//     // Check if the selected run is odd or even
//     if (selectedRun % 2 === 0) {
//         // Even run, change strike opposite
//         changeStrike();
//         strikeNonstrikePlayerScoreboard();
//     } else {
//         // Odd run, change strike
//         changeStrikeOposite();
//         strikeNonstrikePlayerScoreboard();
//     }
// });




//Change strike based on run and extra selected and apply conditional runs
var runsModified = false;

$('#id_extras input[type="radio"]').change(function () {
    var isWideSelected = $('#id_extras input[type="radio"][value="wide"]').prop('checked');
    var isNoballSelected = $('#id_extras input[type="radio"][value="no_ball"]').prop('checked');
    var isPenaltyRunsSelected = $('#id_extras input[type="radio"][value="penalty_runs"]').prop('checked');
    var isWideRunsSelected = $('#id_extras input[type="radio"][value="wide_run"]').prop('checked');
    var isNoBallRunsSelected = $('#id_extras input[type="radio"][value="no_ball_runs"]').prop('checked');
    var isNoBallByesSelected = $('#id_extras input[type="radio"][value="no_ball_byes"]').prop('checked');
    var isNoBallLegByesSelected = $('#id_extras input[type="radio"][value="no_ball_lb"]').prop('checked');

    // Reset run options
    $('#id_runs input[type="radio"]').prop('disabled', false);

    // If "wide" or "no_ball" is selected, check the "1" run option and disable other run options
    if (isWideSelected || isNoballSelected) {
        // If none of the special cases, enable all run options and call changeStrikeOposite
        if (runsModified) {
            // Decrement the runs value by 1
            $('#id_runs input[type="radio"]').each(function () {
                var currentValue = parseInt($(this).val(), 10);
                // Check if the current value is greater than 0 before decrementing
                if (currentValue > 0) {
                    $(this).val(currentValue - 1);
                }
            });
            runsModified = false;
        }

        $('#id_runs input[type="radio"][value="1"]').prop('checked', true);
        $('#id_runs input[type="radio"]').not('[value="1"]').prop('disabled', true);
        changeStrike();
        strikeNonstrikePlayerScoreboard();
    } else if (isPenaltyRunsSelected) {
        // If none of the special cases, enable all run options and call changeStrikeOposite
        if (runsModified) {
            // Decrement the runs value by 1
            $('#id_runs input[type="radio"]').each(function () {
                var currentValue = parseInt($(this).val(), 10);
                // Check if the current value is greater than 0 before decrementing
                if (currentValue > 0) {
                    $(this).val(currentValue - 1);
                }
            });
            runsModified = false;
        }
        // If "penalty_runs" is selected, select run value 5 and make other non-selectable
        $('#id_runs input[type="radio"][value="5"]').prop('checked', true);
        $('#id_runs input[type="radio"]').not('[value="5"]').prop('disabled', true);
    } else if (isWideRunsSelected || isNoBallRunsSelected || isNoBallByesSelected || isNoBallLegByesSelected) {
        // Check if runs have already been modified
        if (!runsModified) {
            // Increment the runs value by 1 and disable other run options
            $('#id_runs input[type="radio"]').each(function () {
                var currentValue = parseInt($(this).val(), 10);
                $(this).val(currentValue + 1);
            });
            runsModified = true;
        }
    } else {
        // If none of the special cases, enable all run options and call changeStrikeOposite
        if (runsModified) {
            // Decrement the runs value by 1
            $('#id_runs input[type="radio"]').each(function () {
                var currentValue = parseInt($(this).val(), 10);
                // Check if the current value is greater than 0 before decrementing
                if (currentValue > 0) {
                    $(this).val(currentValue - 1);
                }
            });
            runsModified = false;
        }
        $('#id_runs input[type="radio"]').prop('disabled', false);
        $('#id_runs input[type="radio"][value="0"]').prop('checked', true);
    }
});

var selectOutPlayer = $('#id_out_player');
selectOutPlayer.on('change', function() {
    var strikePlayer = form.attr('data-striker');
    var nonStrikePlayer = form.attr('data-nonstriker');
    var outPlayer = $(this).val()
    console.log(strikePlayer + ' br ' + nonStrikePlayer + ' out ' + outPlayer)
    form.data('out', $(this).val());

    var partnerPlayer = "";

    // Compare the values
    if (outPlayer !== strikePlayer) {
        partnerPlayer = strikePlayer;
    } else if (outPlayer !== nonStrikePlayer) {
        partnerPlayer = nonStrikePlayer;
    }

   
    console.log('data-id = ' + partnerPlayer);
    var partnerData = $('.strikeboard tr[data-id="'+partnerPlayer+'"]').attr('class');
    partnerClass = '.' + partnerData;
    var partnerRun = $(partnerClass + ' .cmRuns').text();
    var partnerBall = $(partnerClass + ' .cmtBall').text();
    var partnerStat = partnerRun + ' ('+ partnerBall+')';

    
    form.attr('data-partner', partnerPlayer);
    form.attr('data-partnerdata', partnerStat);
});


activeInning = "";

// AJAX form submission
$('#liveScoreForm').submit(function (event) {
    // Prevent the default form submission
    var form =$(this);
    event.preventDefault();
    var form = $(this);
    var activeInning = $(this).attr('data-inning');
    // var variableType = $.type(activeInning);
    var selectedRun = parseInt($('input[name="runs"]:checked').val(), 10);
    // alert(form.data('over'));

    var wicketAtValue = null;
    var wicketByValue = null;
    var teamRun = null;

    // Check if the 'out' field has a value
    if (form.data('out')) {
        wicketAtValue = form.data('over');
        wicketByValue = form.find('#id_wicket_by').val();
        teamRun =  $('.team-run').text();
    }

    if (activeInning === '3') {
        alert('second inning')
        // console.log('oposite' + oppositeTeam)
        selectedTeam = oppositeTeam
        // $('#battingTeam').val(selectedTeam)
        console.log(selectedTeam + 'selected')
        form.data('batting', selectedTeam)
        $('#submitScoreButton').val('End Inning')
    }

    if ($('input[name="wicket"]:checked').val() !== "not_out") {
        // Check if the selected option in additionalDropdown is not equal to the first option
        if ($("#additionalDropdown option:selected").val() === $("#additionalDropdown option:first").val()) {
            $('.out_player-wrapper').prepend('<span class="wk-notice">Please replace out player</span>')
            $('.out_player-wrapper').addClass('bg-warning p-3 shadow rounded')
            return; // Prevent form submission
        }
    }


    // Include custom field values in the data
    var formData = {
        team: form.data('batting'),
        // bowler: form.data('bowler'),
        bowler: $('#id_bowler').val(),
        strike: form.find('#strikeDropdown').val(),
        non_strike: form.find('#nonstrikeDropdown').val(),
        out_player_value: form.data('out'),
        inning: form.data('inning'),
        wicket_at: wicketAtValue,
        batting_team: form.attr('data-batting'),
        run_at: teamRun,
        partner: form.data('partner'),
        partner_data: form.data('partnerdata'),
        wicket_by: wicketByValue,
        runs: $('input[name="runs"]:checked').val(), 
        extras: $('input[name="extras"]:checked').val(), 
        wicket: $('input[name="wicket"]:checked').val(), 
        csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val(),
    };
    $.ajax({
        url: '/cricket/manage_scores/'+selectedMatch+'/', 
        type: form.attr('method'),
        data: formData,  // Serialize the form data
        success: function (data) {
            console.log('AJAX Success:', data);
            if (data.success) {
                alert('Scores updated successfully!');
                if (activeInning === '3') {
                    $.ajax({
                        url: '/cricket/manage_scores/' + selectedMatch + '/',
                        type: 'POST',  // Use the appropriate HTTP method
                        data: { batting_team: oppositeTeam, csrfmiddlewaretoken: formData.csrfmiddlewaretoken },
                        success: function (updateData) {
                                window.location.href = '/cricket/update_inning/' + getMatchIdFromUrl() + '/';
                                return; // Stop further execution, no need to proceed with AJAX call
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            // Handle errors of the second request
                            console.error('Update Error:', thrownError);
                        }
                    });
                }
                console.log(activeInning);
                // fetchAndDisplayBowlersInfo();
                fetchAndDisplayLiveScoresForMatch();
                fetchAndPopulatePlayersTable();
                changeBowler();
                battingTeamSummary();
                // console.log(outPlayer);
                localStorage.setItem('strikePlayer', $('#strikeDropdown').val());
                localStorage.setItem('nonStrikePlayer', $('#nonstrikeDropdown').val());
                $("#strikeChanger").hide();
                strikeNonstrikePlayerScoreboard();
                $('.out_player-wrapper').removeClass('bg-warning p-3 shadow rounded')
                $('input[name="wicket"][value="not_out"]').prop('checked', true);
                $('input[name="extras"][value="no_extra"]').prop('checked', true);
                $('.run-selector .rd-button:first-child input[name="runs"]').prop('checked', true);
                $('.wicket-handler').addClass('d-none');
                $('.form-footer').addClass('d-flex justify-content-between');
                $('.formSubmit').addClass('col-8')
                $('.wk-notice').remove()

                // Check if the selected run is odd or even
                if (selectedRun % 2 === 0) {
                    // Even run, change strike opposite
                    changeStrike();
                    strikeNonstrikePlayerScoreboard();
                } else {
                    // Odd run, change strike
                    changeStrikeOposite();
                    strikeNonstrikePlayerScoreboard();
                }
                
                var strikePlayer = form.find('#strikeDropdown').val()
                var nonStrikePlayer = form.find('#nonstrikeDropdown').val()
                localStorage.setItem('strikePlayer', strikePlayer);
                localStorage.setItem('nonStrikePlayer', nonStrikePlayer);

            } else {
                alert('ERROR');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert('Error updating scores');
        }
    });
});


// Declare a variable to store the total out players count
var totalOutPlayersCount;

// Add this function to fetch and populate players without "not_out" in a table
function fetchAndPopulatePlayersTable() {
    $.ajax({
        url: '/cricket/get_players_without_not_out/'+selectedMatch+'/',
        success: function (data) {
            if ('players' in data) {
                var players = data.players;
                var playersTableBody = $('#playersTableBody');

                // Clear previous content
                playersTableBody.empty();

                // Loop through players and add rows to the table
                for (var i = 0; i < players.length; i++) {
                    var playerData = players[i];

                    // Append a new row to the table
                    playersTableBody.append(
                        '<tr>' +
                        '<td>' + playerData.first_name + ' ' + playerData.last_name + '</td>' +
                        '<td>' + playerData.runs + '</td>' +
                        '<td>' + playerData.total_balls + '</td>' +
                        '<td>' + playerData.total_4s + '</td>' +
                        '<td>' + playerData.total_6s + '</td>' +
                        '<td>' + playerData.wicket + '</td>' +
                        '<td>' + playerData.strike_rate + '</td>' +
                        '</tr>'
                    );
                }

                totalOutPlayersCount = players.length;
                console.log('Total Out Players Count:', totalOutPlayersCount);

                 //setup inning change
                 if (totalOutPlayersCount === 9 && inning === "1") {
                    alert('inning end by all out player')
                    $('#liveScoreForm').attr('data-inning', '3')
                }

            } else {
                console.error('Error: players not found in the response');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching players without "not_out":', thrownError);
        }
    });
}
fetchAndPopulatePlayersTable();

















});

