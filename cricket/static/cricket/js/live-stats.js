$(document).ready(function () {




function getMatchIdFromUrl() {
    var currentUrl = window.location.href;
    var matchIdMatch = currentUrl.match(/\/cricket\/view_stats\/(\d+)\/$/);

    if (matchIdMatch && matchIdMatch.length === 2) {
        return parseInt(matchIdMatch[1], 10);
    } else {
        return null;
    }
}

var match_id = getMatchIdFromUrl();


/*
* Fetch all details for live score card 
**/
function fetchScorecardInfo() {
    $.ajax({
        url: '/cricket/get_live_scorecard_info/' + match_id + '/',
        success: function (data) {

            if ('strike_player_info' in data) {
                var strikePlayerInfo = data.strike_player_info;
                var playerName = strikePlayerInfo.player_name;
                var totalRuns = strikePlayerInfo.total_runs;
                var legalBallsPlayed = strikePlayerInfo.legal_balls_played;
                var playerImage = strikePlayerInfo.player_image;

                $('#battingStrikePlayerInfo').text(`Batting Strike Player: ${playerName} | Total Runs: ${totalRuns} | Legal Balls Played: ${legalBallsPlayed}`);
                $('.strike-player-name').text(playerName);
                $('.strike-player-runs').text('*' + totalRuns);
                $('.strike-player-balls').html('<small class="ms-2">' + legalBallsPlayed + '<small>');
                $('.playerImage').attr('src', playerImage);

            } else {
                console.error('Error: player_name, total_runs, or legal_balls_played not found in the response');
            }

            if ('non_strike_player_info' in data) {
                var nonStrikePlayerInfo = data.non_strike_player_info;
                var player_name = nonStrikePlayerInfo.player_name;
                var total_runs = nonStrikePlayerInfo.total_runs;
                var legal_balls_played = nonStrikePlayerInfo.legal_balls_played;
                var playerImage = nonStrikePlayerInfo.player_image;

                $('.non-strike-player-runs').text(total_runs);
                $('.non-strike-player-name').text(player_name);
                $('.non-strike-player-balls').html('<small class="ms-2">' +legal_balls_played + '</small>');
                $('.non-strike-player-image').attr('src', playerImage);

                // Display the non-strike player information in the designated element
                $('#nonStrikePlayerInfo').text('Non-Strike Player: ' + player_name + ', Runs: ' + total_runs + ', Legal Balls Played: ' + legal_balls_played);
            } else {
                console.error('Error: non_strike_player_info not found in the response');
            }

            if ('bowler_info' in data) {
                var bowler_info = data.bowler_info;                
                var bowlerName = bowler_info.bowler_name;
                var legalBalls = bowler_info.legal_balls;
                var overs = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;
                var bowlerImageURL = bowler_info.bowler_image_url;
                $('.bowlerName').text(bowlerName);
                $('.legalBalls').text(overs); 
                if (bowlerImageURL) { $('.bowler-image').attr('src', bowlerImageURL); }
            } else {
                console.error('Error: Bowler information not found in the response');
            }

            if ('total_over' in data && 'total_balls' in data) {
                var totalOver = data.total_over;
                var totalBalls = data.total_balls;
                var accurateTotalOver = totalOver + (totalBalls % 6) / 10;
                $('.totalOver').text(accurateTotalOver.toFixed(1)); 
            } else {
                console.error('Error: total_over or total_balls not found in the response');
            }

            if ('total_team_runs' in data && 'legal_balls' in data) {
                var totalRuns = data.total_team_runs;
                var legalBalls = data.legal_balls;
                var currentRunRate = (totalRuns / (legalBalls / 6)).toFixed(2);
                $('.totalRuns').text(totalRuns);
                $('#legalBalls').text(legalBalls);
                $('#currentRunRate').text(currentRunRate);
            } else {
                console.error('Error: total_team_runs or legal_balls not found in the response');
            }

            if ('wickets_fallen' in data) {
                var wicketsFallen = data.wickets_fallen;
                $('.wicket-fallen').text(wicketsFallen);
            } else {
                console.error('Error: wickets_fallen not found in the response');
            }

            if ('over_slots' in data) {
                var overSlots = data.over_slots;
                var formattedSlots = separateRunsIntoElements(overSlots);
                $('.overSlotsContainer').html(formattedSlots);
    
            } else {
                console.error('Error: over_slots not found in the response');
            }


            if ('wicket_count' in data && 'player_names' in data) {
                var wicketCount = data.wicket_count;
                var playerNames = data.player_names;

                $('.bowlerWicketCount').text(wicketCount);

                var playerNamesContainer = $('#wicketPlayerNames');
                playerNamesContainer.empty();
                for (var i = 0; i < playerNames.length; i++) {
                    var playerNameHtml = '<p>' + playerNames[i] + '</p>';
                    playerNamesContainer.append(playerNameHtml);
                }
            } else {
                console.error('Error: wicket_count or player_names not found in the response');
            }

            if ('runs_given' in data) {
                var runsGiven = data.runs_given;
                $('#runsGivenByBowler').text(runsGiven);
            } else {
                console.error('Error: runs_given not found in the response');
            }

        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching batting strike player info:', thrownError);
        }
    });
}

    function separateRunsIntoElements(overSlots) {
        var formattedSlots = '';
        var legitimateBallCount = 0;

        for (var i = 0; i < overSlots.length; i++) {
            if (legitimateBallCount === 0) {
                var index = Math.floor(i / 6) + 1;
                formattedSlots += '<ul class="border-end pe-2 me-2"><li class="index me-2">' + index + getSuffix(index) + '</li>';
            }

            var run = overSlots[i];

            if (run !== '1WD') {
                legitimateBallCount++;
            }

            run = (run === '0') ? '<svg xmlns="http://www.w3.org/2000/svg" width="15px" viewBox="0 0 36 36"><path d="M18 11a7 7 0 1 1-7 7 7 7 0 0 1 7-7" class="clr-i-outline clr-i-outline-path-1"/><path d="M18 34a16 16 0 1 1 16-16 16 16 0 0 1-16 16Zm0-30a14 14 0 1 0 14 14A14 14 0 0 0 18 4Z" class="clr-i-outline clr-i-outline-path-2"/><path fill="none" d="M0 0h36v36H0z"/></svg>' : run;

            formattedSlots += '<li>' + run + '</li>';

            if (legitimateBallCount === 6) {
                formattedSlots += '</ul>';
                legitimateBallCount = 0;
            }
        }

        return formattedSlots;
    }

    function getSuffix(index) {
        var remainder10 = index % 10;
        var remainder100 = index % 100;

        if (remainder10 === 1 && remainder100 !== 11) {
            return 'st';
        } else if (remainder10 === 2 && remainder100 !== 12) {
            return 'nd';
        } else if (remainder10 === 3 && remainder100 !== 13) {
            return 'rd';
        } else {
            return 'th';
        }
    }
    
fetchScorecardInfo();
setInterval(fetchScorecardInfo, 5000);



/*
* Fetch all details for live ball by ball over stats
**/
function fetchAndDisplayLiveScoresForMatch() {
    var matchId = getMatchIdFromUrl();
    var totalRunsPerOver = {};
    var currentRunRatePerOver = {};
    var ballsPlayedByStrikePlayer = {}; 
    var totalRuns = '';
    var strikePlayerId = '';

    $.ajax({
        url: '/cricket/get_live_scores_for_match/' + matchId + '/',
        success: function (data) {
            if ('live_scores_for_match' in data) {
                var liveScoresForMatch = data.live_scores_for_match;
                var liveScoresList = $('#liveScoresList');
                var legitimateBallCount = 0;
                var currentOver = 1;
                var scoreHeading = '';
                var scoreSummary = '';
                var scoreLiveHeading = '';
                

                // Check if the response contains total_runs and legal_balls
                if ('total_runs' in data) {
                    totalRuns = data.total_runs;
                } else {
                    console.error('Error: total_runs or legal_balls not found in the response');
                }

                // Reverse loop to display entries from newest to oldest
                for (var i = liveScoresForMatch.length - 1; i >= 0; i--) {
                    var liveScoreData = liveScoresForMatch[i];

                    // Update the strike player ID when it changes
                    if (liveScoreData.strike_player_name !== strikePlayerId) {
                        strikePlayerId = liveScoreData.strike_player_name;

                        // Initialize balls played by the strike player in the current over
                        ballsPlayedByStrikePlayer[currentOver] = 0;
                    }

                    var battingTeamName = liveScoreData.batting_team_name;
                    var strikePlayerName = liveScoreData.strike_player_name;
                    var strikePlayerID = liveScoreData.strike_player_id;
                    var nonStrikePlayerName = liveScoreData.non_strike_player_name;
                    var bowlingPlayerName = liveScoreData.bowler;
                    var bowlingPlayerID = liveScoreData.bowler_id;
                    var nonStrikePlayerID = liveScoreData.non_strike_player_id;

                    if (legitimateBallCount >= 6) {

                        var cumulativeRunsForOver = 0; 

                        for (var over in totalRunsPerOver) {
                            var runs = totalRunsPerOver[over];
                            cumulativeRunsForOver += runs;
                        }

                        scoreHeading =
                            '<div class="bg-secondary text-white p-2 d-flex align-items-center justify-content-between">' +
                            '<div class="lh-sm">' + 
                                '<p class="m-0"><strong> End Of Over ' + currentOver + '</strong></p>' +
                                '<span class="fs-6">' + totalRunsPerOver[currentOver] + ' Runs</span>' +
                            '</div>' + 
                            '<div class="text-end lh-sm">' +
                                '<p class="m-0"><strong>'+ battingTeamName +' ' + cumulativeRunsForOver +'</strong></p>' +
                                '<span class="fs-6"> CRR: '+ (cumulativeRunsForOver / currentOver).toFixed(2) +'</span>' +
                            '</div>' +
                            '</div>'+
                            '<div class="bg-light d-flex align-items-center justify-content-between p-2 player-data-wrapper">' +
                                '<div class="lh-sm col-6 border-end pe-3 batting-data">' + 
                                    '<div class="d-flex justify-content-between" data-strike="'+ strikePlayerID +'"><span class="fs-6">'+ strikePlayerName  +'</span><span class="fs-6"><span class="strk-run"></span> [<span class="strk-ball"></span>b <span class="strk-4"></span>x4 <span class="strk-6"></span>x6 ]</span></div>' +
                                    '<div class="d-flex justify-content-between" data-nonstrike="'+ nonStrikePlayerID +'"><span class="fs-6">' + nonStrikePlayerName + '</span><span class="fs-6"><span class="nonstrk-run"></span> [<span class="nonstrk-ball"></span>b <span class="nonstrk-4"></span>x4 <span class="nonstrk-6"></span>x6]</span></div>' +
                                '</div>' + 
                                '<div class="text-end lh-sm col-6 p-2 bowling-data">' +
                                    '<div class="d-flex justify-content-between align-items-center" data-bowler="'+ bowlingPlayerID +'"><span class="fs-6">' + bowlingPlayerName +'</span><span class="fs-6"><table class="table card overflow-hidden bl-data table-bordered text-center mb-0"><tbody><tr><td>OV</td><td>M</td><td>R</td><td>W</td></tr><tr><td class="bll-ov">1</td><td class="bll-md">0</td><td class="bll-rn">'+ totalRunsPerOver[currentOver] +'</td><td class="bll-wkt">0</td></tr></tbody></table></span></div>' +

                                '</div>' +
                            '</div>';

                        // Display the summary
                        if (scoreSummary) {
                            liveScoresList.prepend('<div class="scoreWrapper mb-2 card overflow-hidden">' + '<div class="summary-heading">' + scoreHeading + '</div><div class="score-summary">' + scoreSummary + '</div></div>');
                        }
                        legitimateBallCount = 0;
                        currentOver++;

                        scoreHeading = '';
                        scoreSummary = '';

                        ballsPlayedByStrikePlayer[currentOver] = 0;
                        
                    }
                        // Check if wicket is "not_out" before including it in the output
                        var wicketInfo = '';
                        var extraInfo = '';
                        var colorClass = '';
                        var narration = '';
                        var dataWicket = '';
                        var extrasAbbreviations = {
                            'wide': 'WD',
                            'wide_run': 'WD+R',
                            'byes': 'B',
                            'leg_byes': 'LB',
                            'no_ball': 'NB',
                            'no_ball_runs': 'NB',
                            'no_ball_byes': 'NB+B',
                            'no_ball_lb': 'NB+LB',
                            'penalty_runs': 'PR'
                        };
                        
                        if (liveScoreData.wicket && liveScoreData.wicket.toLowerCase() !== 'not_out') {
                            wicketInfo = 'W';
                            colorClass = 'wicketColor';
                            dataWicket = 'out';
                            liveScoreData.runs = '';
                        }
                        
                        if (liveScoreData.extras && liveScoreData.extras.toLowerCase() !== 'no_extra') {
                            extraInfo = '<span class="esi"><span>' + (extrasAbbreviations[liveScoreData.extras.toLowerCase()] || liveScoreData.extras) + '</span></span>';
                            colorClass = 'extraColor extra';
                        }

                        var scenariosMessages = {
                            'penalty_runs': '<b>{0}</b> extra runs as <b>PR</b> by {1}',
                            'zero_runs_no_leg_byes': 'No Runs',
                            'regular_runs': '{0} made {1} runs'
                        };
                        
                        var runs = liveScoreData.runs;
                        var extrasType = liveScoreData.extras;
                        var bowler = liveScoreData.bowler;
                        var playerName = liveScoreData.strike_player_name;
                        
                        if (scenariosMessages.hasOwnProperty(extrasType)) {
                            var messageTemplate = scenariosMessages[extrasType];
                            narration = messageTemplate.replace('{0}', runs).replace('{1}', bowler || playerName);
                        } else {
                            // Default case for regular runs
                            narration = scenariosMessages['regular_runs'].replace('{0}', playerName).replace('{1}', runs);
                        }

                        var extrasMessages = {
                            'wide': '<b>WD</b> ball delivered by',
                            'wide_run': '<b>WD</b> ball delivered by with <b>{0}</b> extra runs',
                            'byes': '<b>{0}</b> extra runs through <b>Byes</b>',
                            'leg_byes': '<b>{0}</b> extra runs through <b>LB</b>',
                            'no_ball': '<b>No Ball</b> delivered by with extra <b>{0}</b> runs',
                            'no_ball_byes': '<b>{0}</b> extra runs as <b>NB + B</b> by',
                            'no_ball_lb': '<b>{0}</b> extra runs as <b>NB + LB</b> by',
                            'no_ball_runs': '<b>{0}</b> extra runs as <b>NB + R</b> by'
                          };
                          
                          var extrasType = liveScoreData.extras;
                          var runs = liveScoreData.runs;
                          var bowler = liveScoreData.bowler;
                          
                          if (extrasMessages.hasOwnProperty(extrasType)) {
                            var messageTemplate = extrasMessages[extrasType];
                            narration = messageTemplate.replace('{0}', runs) + ' ' + bowler;
                          }
                    
                        var wicketMessages = {
                            'bowled_out': 'Bowled Out',
                            'caught_out': 'Caught Out',
                            'leg_before_wicket': 'LBW',
                            'run_out': 'Run Out',
                            'stumped_out': 'Stumped Out',
                            'hit_wicket': 'Hit Wicket Out',
                            'retired_out': 'Retired Out',
                            'timed_out': 'Timed Out',
                            'hit_the_ball_twice': 'Hit the ball twice Out',
                            'obstructing_the_field': 'Obstructing the field out',
                            'retired_not_out': 'Retired Out'
                          };
                          
                          var wicketType = liveScoreData.wicket;
                          var wicketOutPlayer = liveScoreData.wicket_out_player_name;
                          var bowler = liveScoreData.bowler;
                          
                          if (wicketMessages.hasOwnProperty(wicketType)) {
                            narration = wicketOutPlayer + ' <b>' + wicketMessages[wicketType] + '</b> by ' + bowler;
                          }

                          scoreSummary +=
                            '<div class="run-item d-flex border-bottom p-2 px-3 mb-2 align-items-center" data-bat="'+ strikePlayerID +'" data-ball="'+ bowlingPlayerID +'">' +
                            '<div class="per-ball text-center d-flex align-items-center" style="height: 40px; width: 40px;">' +
                                (liveScoreData.wicket && liveScoreData.wicket.toLowerCase() !== 'not_out' || liveScoreData.extras && liveScoreData.extras.toLowerCase() !== 'no_extra'
                                    ? ''
                                    : '0.' + (legitimateBallCount + 1)
                                ) +
                            '</div>' + 
                                '<div class="ball-status shadow-sm border rounded-circle d-flex align-middle align-items-center justify-content-center ' + colorClass + '" style="height: 40px; width: 40px;" data-run="'+ liveScoreData.runs +'" data-wicket="'+ dataWicket +'">' + liveScoreData.runs + extraInfo + wicketInfo + '</div>' +
                                '<div class="ball-overview col-9 ps-3">' +
                                    '<div class="overview-title"><strong>' + '<span data-bowler="'+ bowlingPlayerID +'">' +liveScoreData.bowler + '</span>' + ' to ' + '<span data-strike="'+ strikePlayerID +'">' +liveScoreData.strike_player_name + '</strong></div>' +
                                    // '<div class="overview-narration">' + liveScoreData.strike_player_name + ' made ' + liveScoreData.runs + ' runs</div>' +
                                    '<div class="overview-narration">' + narration + '</div>' +
                                '</div>' +
                            '</div>';

                    if (liveScoreData.extras == 'no_extra') {
                        legitimateBallCount++;

                         // Update the count of balls played by the strike player
                        if (liveScoreData.strike_player_name === strikePlayerId) {
                            ballsPlayedByStrikePlayer[currentOver]++;
                        }
                    }
                    liveScoreData.total_balls_by_strike_player = ballsPlayedByStrikePlayer[currentOver];
                    totalRunsPerOver[currentOver] = (totalRunsPerOver[currentOver] || 0) + parseInt(liveScoreData.runs || 0);
                }

                if (scoreSummary) {
                    liveScoresList.prepend('<div class="score-summary card border-top-0 rounded-top-0 mb-2">' + scoreSummary + '</div>');
                }


                var cumulativeRuns = 0;
                var cumulativeBalls = 0;

                for (var over in totalRunsPerOver) {
                    var runs = totalRunsPerOver[over];
                    var balls = 1;

                    // Accumulate runs on each iteration
                    cumulativeRuns += runs;
                    cumulativeBalls += balls;

                    console.log('Runs Data: ' + cumulativeRuns + '||' + cumulativeBalls);
                    currentRunRatePerOver[over] = (cumulativeRuns / cumulativeBalls).toFixed(2);
                }

                // Add a title for the last over if there are remaining entries
                if (legitimateBallCount > 0) {
                    scoreLiveHeading =
                        '<div class="bg-primary text-white p-2 d-flex align-items-center justify-content-between">' +
                            '<div class="lh-sm">' + 
                                '<p class="m-0"><strong> Running Over ' + currentOver + '</strong></p>' +
                                '<span class="fs-6">' + totalRunsPerOver[currentOver] + ' Runs</span>' +
                            '</div>' + 
                            '<div class="text-end lh-sm">' +
                                '<p class="m-0"><strong>' + battingTeamName + ' ' + '<span class="liveRun">' + cumulativeRuns + '</span>' +'</strong></p>' +
                                '<span class="fs-6"> CRR: '+ currentRunRatePerOver[over] +'</span>' +
                            '</div>' +
                        '</div>'+
                        '<div class="bg-info text-white d-flex align-items-center justify-content-between p-2">' +
                            '<div class="lh-sm col-6 border-end pe-3">' + 
                                '<div class="d-flex justify-content-between" data-strike="'+ strikePlayerID +'"><span class="fs-6">' + strikePlayerName +'</span><span class="fs-6">7 (18b 1x4)</span></div>' +
                                '<div class="d-flex justify-content-between" data-nonstrike="'+ nonStrikePlayerID +'"><span class="fs-6">' + nonStrikePlayerName + '</span><span class="fs-6">38 (136b 3x4)</span></div>' +
                            '</div>' + 
                            '<div class="text-end lh-sm col-6 p-2 ">' +
                                '<div class="d-flex justify-content-between" data-bowler="'+ bowlingPlayerID +'"><span class="fs-6">' + bowlingPlayerName +'</span><span class="fs-6"> OV-M-R-W</span></div>' +

                            '</div>' +
                        '</div>'
                }
                // Display the summary
                if (scoreSummary) {
                    liveScoresList.prepend('<div class="summary-heading card border-bottom-0 rounded-bottom-0 overflow-hidden">' + scoreLiveHeading + '</div>');
                }
            } else {
                console.error('Error: live_scores_for_match not found in the response');
            }
            populateBarChart(totalRunsPerOver);
            populateLineChart(currentRunRatePerOver);
            // alert(totalRuns);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching live scores for the match:', thrownError);
        }
    });
}

fetchAndDisplayLiveScoresForMatch();
    


/*
* Fetch out player data
**/
function fetchAndPopulatePlayersTable() {
$.ajax({
    url: '/cricket/get_players_without_not_out/'+selectedMatch+'/',
    success: function (data) {
        if ('players' in data) {
            var players = data.players;
            var playersTableBody = $('#battingPlayerStats');

            playersTableBody.empty();

            for (var i = 0; i < players.length; i++) {
                var playerData = players[i];

                // Append a new row to the table
                playersTableBody.append(
                    '<tr>' +
                    '<td class="col-8">' + playerData.first_name + ' ' + playerData.last_name + '</br> <small>' + '<span>' + playerData.wicket + ' </span>' + playerData.fielder_name + ' b ' +   playerData.bowler_name + ' </small> '+'</td>' +
                    '<td>' + playerData.runs + '</td>' +
                    '<td>' + playerData.total_balls + '</td>' +
                    '<td>' + playerData.total_4s + '</td>' +
                    '<td>' + playerData.total_6s + '</td>' +
                    '<td>' + playerData.strike_rate + '</td>' +
                    '</tr>'
                );

                // Log the bowler's name to the browser console
                console.log('Bowler: ' + (playerData.bowler));
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

        if ('extras' in data) {
            var extras = data.extras;

            // Create a string to hold the HTML content
            var htmlContent = '<div class="d-flex">' + data.total_extras_count + ' (';

            // Display the extra counts
            for (var i = 0; i < extras.length; i++) {
                var extraData = extras[i];
                htmlContent += '<span class="px-1">' + extraData.extras + ' ' + extraData.count + '</span>';

                // Conditionally add a comma for all but the last item
                if (i < extras.length - 1) {
                    htmlContent += ',';
                }
            }

            htmlContent += ')</div>';

            // Assign the HTML content to the specified div
            $('#totalExtras').html(htmlContent);
        } else {
            console.error('Error: extras not found in the response');
        }


        if ('yet_to_bat' in data) {
            var remainingPlayer = data.yet_to_bat;
            var notOutPlayer = $('#noPlayers');
    
            // Loop through players and add rows to the table
            for (var i = 0; i < remainingPlayer.length; i++) {
                var playerData = remainingPlayer[i];
                // Append a new row to the table
                notOutPlayer.append(
                    '<span class="d-flex align-items-center"><span class="list-group-item">' + playerData.first_name + ' ' + playerData.last_name + '</span><span class="sm-dot"></span></span>'
                );
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





function wicketFall() {
    $.ajax({
        url: '/cricket/get_players_without_not_out/' + selectedMatch + '/',
        success: function (data) {
            if ('players' in data) {
                var players = data.players;

                // Sort players array in descending order based on wicket_at
                players.sort(function (a, b) {
                    return b.wicket_at - a.wicket_at;
                });

                var playersTableBody = $('#wicketFall');

                // Clear previous content
                playersTableBody.empty();

                // Loop through players and add rows to the table
                players.forEach(function (playerData, index) {
                    // Append a new row to the table
                    playersTableBody.append(
                        '<div class="d-flex align-items-center">' +
                        '<span>' + playerData.run_at + '/' + (players.length - index) + '</span> ' +
                        '<span>(' + playerData.first_name + ' ' + playerData.last_name + ', ' + (String(playerData.wicket_at) || 'N/A') + ' ov)</span>' +
                        '<span class="sm-dot"></span>' +
                        '</div>'
                    );

                    // Log the bowler's name to the browser console
                    console.log('Bowler: ' + (playerData.bowler));
                });

                totalOutPlayersCount = players.length;
                console.log('Total Out Players Count:', totalOutPlayersCount);

                // Setup inning change
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

wicketFall();



// Function to calculate maiden overs
function calculateMaidenOvers(runsEntries) {
    var overs = [];
    var currentOver = [];
    var maidenOverCount = 0;

    for (var i = 0; i < runsEntries.length; i++) {
        var entry = runsEntries[i];

        // Check if the current entry is part of a new over
        var isNewOver = i % 6 === 0;

        if (isNewOver) {
            // Counter for legal balls in the current over
            var legalBalls = 0;
            // Flag to track if the over is a maiden over
            var maidenOver = true;
        }

        legalBalls++;  // Count all entries as legal balls

        // Check if the runEntry has non-zero runs, if yes, it's not a maiden over
        if (entry.runs !== 0) {
            maidenOver = false;
        }

        // Check if the current entry is the last in the over
        var isLastInOver = legalBalls === 6 || i === runsEntries.length - 1;

        if (isLastInOver) {
            if (maidenOver) {
                maidenOverCount++;
            }
        }
    }

    return maidenOverCount;
}






//Get bowler stats based on selected bowler ID
function bowlerScoreboardStats(bowlerID) {
    var matchId = getMatchIdFromUrl();
    $.ajax({
        url: '/cricket/get_bowler_stats/' + matchId + '/',
        data: { 'bowler_id': bowlerID },
        success: function (data) {
            if ('bowlers_info' in data && data.bowlers_info.length > 0) {
                var bowlersInfo = data.bowlers_info;

                // Create a table body to append rows
                var tableBody = $('#playerScoreboardBody');

                // Loop through each bowler and append a row to the table
                for (var i = 0; i < bowlersInfo.length; i++) {
                    var bowlerStats = bowlersInfo[i];

                    // Create a new row for each bowler
                    var newRow = $('<tr>');
                    newRow.append('<td class="bp-bowlerName col-8">' + bowlerStats.bowler_name + '</td>');
                    newRow.append('<td class="bp-totalOvers">' + bowlerStats.overs + '</td>');
                     // Calculate and display maiden overs
                    var maidenOverCount = calculateMaidenOvers(bowlerStats.runs_entries);
                    newRow.append('<td class="bp-maiden">' + maidenOverCount + '</td>');
                    
                    newRow.append('<td class="bp-runSpent">' + bowlerStats.runs_given + '</td>');
                    newRow.append('<td class="bp-wicketTaken">' + bowlerStats.wickets_taken + '</td>');
                    
                    // Check if totalOversBowled is non-zero before calculating the economy
                    var bowlerEconomy = bowlerStats.overs !== 0 ? bowlerStats.runs_given / bowlerStats.overs : 0;
                    newRow.append('<td class="bp-economy">' + bowlerEconomy.toFixed(2) + '</td>');


                    tableBody.append(newRow);
                }
            } else {
                console.error('Error: bowlers_info not found in the response or the array is empty');
            }
        },
        error: function (error) {
            console.error('Error fetching bowlers\' information:', error);
        }
    });
}

// Call the function to get bowler stats
bowlerScoreboardStats();






function wicketFallWorm() {
    $.ajax({
        url: '/cricket/get_players_without_not_out/' + selectedMatch + '/',
        success: function (data) {
            if ('players' in data) {
                var players = data.players;

                // Sort players array in descending order based on wicket_at
                players.sort(function (a, b) {
                    return b.wicket_at - a.wicket_at;
                });

                // Arrays to store data for the chart
                var oversData = [];
                var oversLabel = [];
                var runsData = [];

                var playersTableBody = $('#wicketFalls');

                // Clear previous content
                playersTableBody.empty();

                // Loop through players and add rows to the table
                players.forEach(function (playerData, index) {
                    // Append a new row to the table
                    playersTableBody.append(
                        '<div class="d-flex align-items-center">' +
                        '<span>' + playerData.runs + '/' + (players.length - index) + '</span> ' +
                        '<span>(' + playerData.first_name + ' ' + playerData.last_name + ', ' + (String(playerData.wicket_at) || 'N/A') + ' ov)</span>' +
                        '</div>'
                    );

                    // Log the bowler's name to the browser console
                    console.log('Bowler: ' + (playerData.bowler));

                    // Collect data for the chart
                    oversData.push(playerData.wicket_at);
                    runsData.push(playerData.run_at);
                    oversLabel.push(playerData.runs + '/' + (players.length - index)+ playerData.first_name + ' ' + playerData.last_name + ', ' + (String(playerData.wicket_at) || 'N/A') + ' ov)');
                });

                totalOutPlayersCount = players.length;
                console.log('Total Out Players Count:', totalOutPlayersCount);

                // Setup inning change
                if (totalOutPlayersCount === 9 && inning === "1") {
                    alert('inning end by all out player')
                    $('#liveScoreForm').attr('data-inning', '3')
                }

                // Create a line chart using Chart.js
                createLineChart(oversData, runsData, oversLabel);

            } else {
                console.error('Error: players not found in the response');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching players without "not_out":', thrownError);
        }
    });
}



// Function to create a line chart with tooltip labels
function createLineChart(oversData, runsData, oversLabel) {
    // Add a data point to start the line from (0, 0)
    oversData = [0, ...oversData];
    runsData = [0, ...runsData];
    oversLabel = ['', ...oversLabel];

    // Combine data into an array of objects for sorting
    const combinedData = oversData.map((over, index) => ({ over, runs: runsData[index], label: oversLabel[index] }));

    // Sort the array based on overs
    combinedData.sort((a, b) => a.over - b.over);

    // Extract sorted data back into individual arrays
    oversData = combinedData.map(data => data.over);
    runsData = combinedData.map(data => data.runs);
    oversLabel = combinedData.map(data => data.label);

    const ctx = document.getElementById('cricketChart').getContext('2d');

    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: oversData.map((over) => over),
            datasets: [{
                label: 'India',
                data: runsData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Overs',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Runs',
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const index = context.dataIndex;
                            return 'Runs: ' + context.dataset.data[index] + '\n' + oversLabel[index];
                        },
                    }
                }
            }
        }
    });
}

// Call the function to fetch data and create the chart
wicketFallWorm();



function populateBarChart(data) {
    var ctx = document.getElementById('myBarChart').getContext('2d');
    
    var chartData = {
        labels: Object.keys(data),
        datasets: [{
            label: 'Total Runs per Over',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            data: Object.values(data),
        }]
    };

    var chartOptions = {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom'
            },
            y: {
                beginAtZero: true
            }
        }
    };

    var myBarChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

function populateLineChart(data) {
    var ctx = document.getElementById('myLineChart').getContext('2d');

    var chartData = {
        labels: Object.keys(data),
        datasets: [{
            label: 'Current Run Rate per Over',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: false,
            data: Object.values(data),
        }]
    };

    var chartOptions = {
        scales: {
            x: {
                position: 'bottom',
                beginAtZero: false,
                min: 0,
                max: Object.keys(data).length - 1,
                stepSize: 1,
                grid: {
                    display: true,
                    drawOnChartArea: false,
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: false,
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                enabled: false,
            },
            beforeInit: function (chart) {
                // Apply your custom CSS styles here
                chart.canvas.parentNode.style.cssText = 'height: 300px; width: 400px;'; // Example styles
            }
        },
        elements: {
            point: {
                radius: 0,
            }
        }
    };

    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
}



//Partnership data



function fetchPartnership() {
    $.ajax({
        url: '/cricket/get_player_partnership/'+selectedMatch+'/',
        success: function (data) {
            if ('players' in data) {
                var players = data.players;
                var playersTableBody = $('#partnership');
    
                // Loop through players and add rows to the table
                // Loop through players and add rows to the table
for (var i = 0; i < players.length; i++) {
    var playerData = players[i];
    var runPartnershipData1 = parseInt(playerData.runs);
    var runPartnershipDataBall2 = parseInt(playerData.total_balls );
    var runPartnershipData2 = playerData.partner_data;

    // Check if runPartnershipData2 is not null or undefined
    if (runPartnershipData2 != null && runPartnershipData2 !== undefined) {
        // Split the data into two parts based on the space
        var splitData = runPartnershipData2.split(' ');

        // Extract the numbers
        var partner2run = parseInt(splitData[0]); // The number before the space
        var partner2ball = parseInt(splitData[1].replace('(', '').replace(')', '')); // The number within brackets

        var finalPartnershipRun = partner2run + runPartnershipData1;
        var finalPartnershipBall = partner2ball + runPartnershipDataBall2;
        // Append a new row to the table
        playersTableBody.append(
            '<div class="d-flex py-2">' +
            '<div class="col-4">' + playerData.first_name + ' ' + playerData.last_name + '<br>' + playerData.runs + '(' + playerData.total_balls +')' +'</div>' +
            '<div class="col-4 text-center">'+ finalPartnershipRun + '(' + finalPartnershipBall + ')' + '<div class="d-flex align-items-center justify-content-center pt-graph">' + '<span style="width:'+ playerData.runs+'%"></span> '+'<span style="width:'+ partner2run +'%"></span>' + '</div>'+'</div>'+
            '<div class="col-4">' + playerData.partner + '<br>' + playerData.partner_data + '</div>' +
            '</div>'
        );
    } else {
        console.error('runPartnershipData2 is null or undefined for player:', playerData.first_name + ' ' + playerData.last_name);
    }
}

    
                totalOutPlayersCount = players.length;
                console.log('Total Out Players Count:', totalOutPlayersCount);
    
            } else {
                console.error('Error: players not found in the response');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error('Error fetching players without "not_out":', thrownError);
        }
    });
    
    }
    fetchPartnership();

    function calculateRunsAndEntries() {
        $(".scoreWrapper").each(function () {
          var $scoreWrapper = $(this);
    
          var dataStrike = parseInt(
            $scoreWrapper.find(".summary-heading .batting-data [data-strike]").data(
              "strike"
            )
          );
          var dataNonStrike = parseInt(
            $scoreWrapper.find(".summary-heading .batting-data [data-nonstrike]").data(
              "nonstrike"
            )
          );
    
          var sumStrike = 0;
          var sumNonStrike = 0;
          var countStrike = 0;
          var countNonStrike = 0;
          var countFours = 0;
          var countSixes = 0;
          var allRunsZero = true;
          var countWickets = 0;
    
          $scoreWrapper.find(".score-summary .run-item").each(function () {
            var $runItem = $(this);
            var dataBat = parseInt($runItem.data("bat"));
            var dataRun = parseInt($runItem.find(".ball-status").data("run")) || 0;
            var isExtra = $runItem.find(".ball-status").hasClass("extra");
            var isWicketOut = $runItem.find(".ball-status[data-wicket='out']").length > 0;

            if (dataRun > 0) {
                allRunsZero = false; 
            }

            if (isWicketOut) {
                countWickets++;
            }
    
            if (!isExtra) {
              if (dataBat === dataStrike) {
                sumStrike += dataRun;
                countStrike++;
              } else if (dataBat === dataNonStrike) {
                sumNonStrike += dataRun;
                countNonStrike++;
              }
    
              // Count "4" and "6"
              if (dataBat === dataStrike) {
                if (dataRun === 4) {
                  countFours++;
                } else if (dataRun === 6) {
                  countSixes++;
                }
              } else if (dataBat === dataNonStrike) {
                if (dataRun === 4) {
                  countFours++;
                } else if (dataRun === 6) {
                  countSixes++;
                }
              }
            }
          });

          $scoreWrapper.find(".summary-heading .batting-data [data-strike] .strk-run").text(sumStrike);
          $scoreWrapper.find(".summary-heading .batting-data [data-nonstrike] .nonstrk-run").text(sumNonStrike);
          $scoreWrapper.find(".summary-heading .batting-data [data-strike] .strk-ball").text(countStrike);
          $scoreWrapper.find(".summary-heading .batting-data [data-nonstrike] .nonstrk-ball").text(countNonStrike);
          $scoreWrapper.find(".summary-heading .batting-data [data-strike] .strk-4").text(dataStrike === dataNonStrike ? countFours : 0);
          $scoreWrapper.find(".summary-heading .batting-data [data-strike] .strk-6").text(dataStrike === dataNonStrike ? countSixes : 0);
          $scoreWrapper.find(".summary-heading .batting-data [data-nonstrike] .nonstrk-4").text(dataStrike === dataStrike ? countFours : 0);
          $scoreWrapper.find(".summary-heading .batting-data [data-nonstrike] .nonstrk-6").text(dataStrike === dataStrike ? countSixes : 0);
          $scoreWrapper.find(".summary-heading .bowling-data .bll-md").text(allRunsZero ? "1" : "0"); 
          $scoreWrapper.find(".summary-heading .bowling-data .bll-wkt").text(countWickets);
        });
      }
    
      // Execute the function after 5 seconds
      setTimeout(calculateRunsAndEntries, 5000);
    















});
















