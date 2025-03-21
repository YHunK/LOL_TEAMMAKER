$(function () {
    const account_get_puuid = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/`;
    const account_get_summoner = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/`;
    const account_get_league = `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/`;
    const account_get_champion = `https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/`;
    
    let api_key;

    let api_key_xmlhttp = new XMLHttpRequest();
    let url = "api_key.json";

    api_key_xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let api_key_json = JSON.parse(api_key_xmlhttp.responseText);
            api_key = api_key_json.api_key;
        }
    };
    api_key_xmlhttp.open("GET", url, true);
    api_key_xmlhttp.send();

    /* 챔피언 json data */
    /* let champion_json_url = proxy_url + `https://ddragon.leagueoflegends.com/cdn/14.14.1/data/ko_KR/champion.json`; */
    let champion_json_url = `https://ddragon.leagueoflegends.com/cdn/14.14.1/data/ko_KR/champion.json`;
    let champion_data_map = new Map();
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let json = JSON.parse(xmlhttp.responseText);
            for (const champName in json.data) {
                if (json.data.hasOwnProperty(champName)) {
                    const champ = json.data[champName];
                    champion_data_map.set(Number(champ.key), {id: champ.id, name: champ.name});
                }
            }
        }
    };

    xmlhttp.open("GET", champion_json_url, true);
    xmlhttp.send();
    /* 챔피언 json data */

    if (localStorage.getItem('user')) {
        let userArray = JSON.parse(localStorage.getItem('user'));
        userArray.forEach(user => {
            let card = `<div class="userCard">
                            <input type="text" class="nickNameClass" value="${user.nickName}" disabled>
                            <input type="number" class="scoreClass" value="${user.score}" placeholder="점수">
                            <span class="deleteCard">X</span>
                        </div>`;
            $('#user-container').append(card);
        });
    }
    
    $('#nickName').on("keyup", function (key) {
        if (key.keyCode == 13) {
            $('#score').focus();
        }
    })

    $('#score').on("keyup", function (key) {
        if (key.keyCode == 13) {
            let nickName = $('#nickName').val();
            createUserCard();

            // '닉네임#태그'인 경우 프로필 생성
            const regex = /^.*#.*$/;

            if(regex.test(nickName)){
                $('#userId').val(nickName);
                createProfileCard();
            };
        }
    })

    function createUserCard() {
        let nickName = $('#nickName').val();
        let score = $('#score').val();

        let card = `<div class="userCard">
                        <input type="text" class="nickNameClass" value="${nickName}" disabled>
                        <input type="number" class="scoreClass bot_shadow" value="${score}" placeholder="점수">
                        <span class="deleteCard">X</span>
                    </div>`;
        $('#user-container').append(card);
        $('#nickName').val('');
        $('#score').val('1');
        $('#nickName').focus();
    }

    $(document).on("click", ".deleteCard", function () {
        $(this).closest('.userCard').remove();
    })

    $('#enter_btn').on("click", function () {
        let user = [];
        $('.userCard').each(function (index, item) {
            let nickName = $(item).find('.nickNameClass').val();
            let score = $(item).find('.scoreClass').val();
            user.push({ nickName: nickName, score: parseInt(score) });
        });

        localStorage.setItem("user", JSON.stringify(user));

        // 짝수 체크
        if (user.length % 2 !== 0) {
            alert('유저의 수는 짝수여야 합니다.');
            return;
        }

        // 점수 내림차순
        user.sort((a, b) => b.score - a.score);

        // 모든 가능한 팀 조합을 생성
        let allTeamCombinations = generateAllTeamCombinations(user);

        // 점수 차이가 작은 상위 10개의 팀 조합 가져오기
        let top5Teams = findTop10Teams(allTeamCombinations);

        // 랜덤으로 한 팀 조합 선택
        let selectedTeam = selectRandomTeam(top5Teams);

        // 결과 출력
        displayTeam(selectedTeam);
    });

    // 모든 가능한 팀 조합 생성 함수
    function generateAllTeamCombinations(users) {
        let allCombinations = [];

        // 모든 조합 생성
        function generateCombinations(index, teamA, teamB) {
            if (index >= users.length) {
                if (teamA.length === teamB.length) {
                    allCombinations.push({ teamA: teamA.slice(), teamB: teamB.slice() });
                }
                return;
            }

            // 팀 A에 추가
            teamA.push(users[index]);
            generateCombinations(index + 1, teamA, teamB);
            teamA.pop();

            // 팀 B에 추가
            teamB.push(users[index]);
            generateCombinations(index + 1, teamA, teamB);
            teamB.pop();
        }

        generateCombinations(0, [], []);
        return allCombinations;
    }

    // 점수 차이가 작은 상위 10개의 팀 조합 찾기 함수
    function findTop10Teams(allCombinations) {
        let sortedCombinations = allCombinations.sort((a, b) => {
            let teamAScore = a.teamA.reduce((total, user) => total + user.score, 0);
            let teamBScore = a.teamB.reduce((total, user) => total + user.score, 0);
            let differenceA = Math.abs(teamAScore - teamBScore);

            teamAScore = b.teamA.reduce((total, user) => total + user.score, 0);
            teamBScore = b.teamB.reduce((total, user) => total + user.score, 0);
            let differenceB = Math.abs(teamAScore - teamBScore);

            return differenceA - differenceB;
        });

        return sortedCombinations.slice(0, 10);
    }

    // 랜덤으로 하나의 팀 조합 선택 함수
    function selectRandomTeam(top5Teams) {
        let randomIndex = Math.floor(Math.random() * top5Teams.length);
        return top5Teams[randomIndex];
    }

    function displayTeam(selectedTeam) {
        $('#a_container').empty();
        $('#b_container').empty();

        $('#a_container').append('<div class="teamName"> A TEAM </div>');
        $('#b_container').append('<div class="teamName"> B TEAM </div>');

        let teamA = selectedTeam.teamA;
        let teamB = selectedTeam.teamB;

        let teamAScore = teamA.reduce((total, user) => total + user.score, 0);
        let teamBScore = teamB.reduce((total, user) => total + user.score, 0);

        teamA.forEach(user => {
            let card = `<div class="teamCard">
                            <input type="text" class="nickNameClass" value="${user.nickName}" disabled>
                            <input type="number" class="scoreClass" value="${user.score}" disabled>
                        </div>`;
            $('#a_container').append(card);
        });

        teamB.forEach(user => {
            let card = `<div class="teamCard">
                            <input type="text" class="nickNameClass" value="${user.nickName}" disabled>
                            <input type="number" class="scoreClass" value="${user.score}" disabled>
                        </div>`;
            $('#b_container').append(card);
        });

        $('#a_container').append(`<div class="teamName"> Team A - Total Score: ${teamAScore} </div>`);
        $('#b_container').append(`<div class="teamName"> Team B - Total Score: ${teamBScore} </div>`);
    }

    $('#userId').on("keyup", function (key) {
        if (key.keyCode == 13) {
            createProfileCard();
        }
    })

    $('#search_btn').on("click", function () {
        createProfileCard();
    })

    $(document).on("click", ".userInfo_drop_btn", function () {
        $(this).closest('.userInfo-container').remove();
    })

    function createProfileCard(){
        let user_id = $('#userId').val();

        let gameName = user_id.split("#")[0];
        let tagLine = user_id.split("#")[1];

        let url_get_puuid = `/get_puuid/${gameName}/${tagLine}/${api_key}`;

        fetch(url_get_puuid)
        .then(res => res.json())
        .then(data => func_puuid(data));

        function func_puuid(data){
            let puuid_data = data.puuid;

            if(puuid_data){
                let profile = `<div class="userInfo-container">
                                    <div style='display: flex; flex-direction: row-reverse;'><span class='userInfo_drop_btn'>X</span></div>
                                    <div style='display: flex;'>
                                        <div class='profile_icon'></div>    
                                        <div style='display: flex; flex-direction: column;'>
                                            <div style='padding: 5px 5px 0px 5px;'>
                                                <span class='profile_gameName'>${gameName}</span>
                                                <span class='profile_tagLine'>#${tagLine}</span>
                                            </div>
                                            <div style='padding: 5px 5px 0px 8px;'>
                                                <span class='profile_level'>레벨 : <span class='profile_level_tag'></span></span>
                                            </div>
                                            <div style='padding: 5px 5px 0px 8px; font-size: 12px;'>
                                                <span class='solo_rank'><span style='width: 150px; display: inline-block;'>솔로 : <span class='tier_solo'></span></span> <span class='cnt_solo'></span>전 승 : <span class='wins_solo'></span> / 패 : <span class='losses_solo'></span> (<span class='rate_solo'></span>%)</span>
                                                <span class='free_rank'><span style='width: 150px; display: inline-block;'>자유 : <span class='tier_free'></span></span> <span class='cnt_free'></span>전 승 : <span class='wins_free'></span> / 패 : <span class='losses_free'></span> (<span class='rate_free'></span>%)</span>
                                            </div>
                                        </div>    
                                    </div>
                                    <div style='display: flex; flex-direction: column;'>
                                        <span style='font-size:14px; margin:5px;'>숙련도</span>
                                        <div class='top_champion'></div>
                                    </div>
                                    
                                </div>`;

                let newProfile = $(profile).appendTo('#search-container');

                let url_get_summoner = account_get_summoner + puuid_data + "?api_key=" + api_key;

                fetch(url_get_summoner)
                .then(res => res.json())
                .then(data => func_summoner(data, newProfile));

                let url_get_champion = account_get_champion + puuid_data + "?api_key=" + api_key;

                fetch(url_get_champion)
                .then(res => res.json())
                .then(data => func_champion(data, newProfile));

            }else{
                alert("해당 이름의 소환사를 찾을 수 없습니다.\n정확한 태그명(#????)과 함께 검색해 주세요.");
            }
            
        }

        function func_summoner(data, newProfile){
            let summoner_data = data;
            let profile_icon = `<img style='width: 100px;' src='https://ddragon.leagueoflegends.com/cdn/14.14.1/img/profileicon/${summoner_data.profileIconId}.png'>`;
            newProfile.find('.profile_icon').append(profile_icon);
            newProfile.find('.profile_level').append(summoner_data.summonerLevel);

            let url_get_league = account_get_league + summoner_data.id + "?api_key=" + api_key;

            fetch(url_get_league)
            .then(res => res.json())
            .then(data => {
                let tier_solo = '';
                let wins_solo = 0;
                let losses_solo = 0;
                let cnt_solo = 0;
                let rate_solo = 0;
                let tier_free = '';
                let wins_free = 0;
                let losses_free = 0;
                let cnt_free = 0;
                let rate_free = 0;

                data.forEach(d => {
                    if(d.queueType === 'RANKED_SOLO_5x5'){
                        tier_solo = d.tier + ' ' + d.rank;
                        wins_solo = d.wins;
                        losses_solo = d.losses;
                        cnt_solo = wins_solo + losses_solo;
                        rate_solo = (wins_solo / cnt_solo * 100).toFixed(1);
                    }else if(d.queueType === 'RANKED_FLEX_SR'){
                        tier_free = d.tier + ' ' + d.rank;
                        wins_free = d.wins;
                        losses_free = d.losses;
                        cnt_free = wins_free + losses_free;
                        rate_free = (wins_free / cnt_free * 100).toFixed(1);
                    }
                });

                newProfile.find('.tier_solo').append(tier_solo);
                newProfile.find('.wins_solo').append(wins_solo);
                newProfile.find('.losses_solo').append(losses_solo);
                newProfile.find('.cnt_solo').append(cnt_solo);
                newProfile.find('.rate_solo').append(rate_solo);

                newProfile.find('.tier_free').append(tier_free);
                newProfile.find('.wins_free').append(wins_free);
                newProfile.find('.losses_free').append(losses_free);
                newProfile.find('.cnt_free').append(cnt_free);
                newProfile.find('.rate_free').append(rate_free);
                
            });
        }

        function func_champion(data, newProfile){
            let top_champion = ``;
            for(let i in data){
                if(i > 20) break;
                let champ_id = data[i].championId;
                let champ_level = data[i].championLevel;
                let champion = champion_data_map.get(champ_id);

                top_champion += `<div>
                                    <div><img style='width: 60px;' src='https://ddragon.leagueoflegends.com/cdn/14.14.1/img/champion/${champion.id}.png'></div>
                                    <div style='display:flex; font-size:12px; flex-direction: column;'>
                                        <div style='margin: 0 auto;'>`;
                
                let champ_img = ``;
                if(champ_level < 10){
                    champ_img = `<img style='width: 33px;' src='/img/mastery-${champ_level}.png'>`;
                }else{
                    champ_img = `<img style='width: 33px;' src='/img/mastery-10.png'><div style='text-align: center;'><span class='champ_level_tag'>${champ_level}</span></div>`;
                }

                top_champion += `${champ_img}</div>
                                    </div>
                                </div>`;
            }

            newProfile.find('.top_champion').append(top_champion);
        }
    }

})
