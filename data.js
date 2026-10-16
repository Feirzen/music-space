/* =========================================================
   data.js — built-in songs (public domain only), the Path
   (30 lessons in 6 chapters), chapter song rosters, chord presets.
   Song body: "# Section" lines, chords inline like [G]word.
   melody = [lowest, highest] note of the tune as written (approx).
   spotify: "track:<id>" for an exact recording, else a search phrase.
   ========================================================= */
const N = s => Theory.nameToMidi(s);

const BUILTIN_SONGS = [
  { id: "amazing-grace", title: "Amazing Grace", artist: "John Newton (1779)", tags: ["strum","3/4","hymn","campfire"], level: 1,
    key: "G", time: "3/4", bpm: 80, melody: [N("D4"), N("D5")], strum: "D – D U D U", strumTip: "Waltz feel: big bass strum on 1, lighter strums on 2 and 3.",
    pick: "arp34", spotify: "Amazing Grace hymn",
    body: `# Verse 1
A[G]mazing grace, how [C]sweet the [G]sound
That saved a wretch like [D]me
I [G]once was lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see

# Verse 2
'Twas [G]grace that taught my [C]heart to [G]fear
And grace my fears re[D]lieved
How [G]precious did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved

# Verse 3
Through [G]many dangers, [C]toils and [G]snares
I have already [D]come
'Tis [G]grace hath brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home

# Verse 4
When [G]we've been there ten [C]thousand [G]years
Bright shining as the [D]sun
We've [G]no less days to [C]sing God's [G]praise
Than [Em]when we'd [D]first be[G]gun` },
  { id: "red-river-valley", title: "Red River Valley", artist: "Traditional", tags: ["strum","folk","campfire"], level: 1,
    key: "G", time: "4/4", bpm: 92, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Classic campfire strum. Keep your hand moving even on the misses.",
    pick: "travis", spotify: "Red River Valley folk",
    body: `# Verse 1
From this [G]valley they say you are going
We will miss your bright eyes and sweet [D]smile
For they [G]say you are taking the [C]sunshine
That has [G]brightened our [D]pathway a [G]while

# Chorus
Come and [G]sit by my side if you love me
Do not hasten to bid me a[D]dieu
But re[G]member the Red River [C]Valley
And the [G]cowboy who [D]loved you so [G]true

# Verse 2
Won't you [G]think of the valley you're leaving
Oh how lonely, how sad it will [D]be
Oh think [G]of the fond heart you're [C]breaking
And the [G]grief you are [D]causing to [G]me` },
  { id: "oh-susanna", title: "Oh! Susanna", artist: "Stephen Foster (1848)", tags: ["strum","folk","crowd"], level: 1,
    key: "G", time: "4/4", bpm: 110, melody: [N("D4"), N("E5")], strum: "B D B D (boom-chick)", strumTip: "Pick the bass note, then strum. Bass, strum, bass, strum.",
    pick: "travis", spotify: "Oh Susanna Stephen Foster",
    body: `# Verse 1
I [G]come from Alabama with a banjo on my [D]knee
I'm [G]going to Louisiana, my [D]true love for to [G]see
It [G]rained all night the day I left, the weather it was [D]dry
The [G]sun so hot I froze to death, Su[D]sanna, don't you [G]cry

# Chorus
Oh, Su[C]sanna, oh don't you cry for [G]me
For I [G]come from Alabama with a [D]banjo on my [G]knee` },
  { id: "swing-low", title: "Swing Low, Sweet Chariot", artist: "Spiritual", tags: ["strum","campfire","crowd"], level: 1,
    key: "G", time: "4/4", bpm: 72, melody: [N("B3"), N("D5")], strum: "D – D U – U D U", strumTip: "Slow and swingy. Let it breathe.",
    pick: "arp44", spotify: "Swing Low Sweet Chariot",
    body: `# Chorus
[G]Swing low, sweet [C]chari[G]ot
Comin' for to carry me [D]home
[G]Swing low, sweet [C]chari[G]ot
Comin' for to [D]carry me [G]home

# Verse 1
I [G]looked over Jordan, and [C]what did I [G]see
Comin' for to carry me [D]home
A [G]band of angels [C]comin' after [G]me
Comin' for to [D]carry me [G]home

# Verse 2
If [G]you get there be[C]fore I [G]do
Comin' for to carry me [D]home
Tell [G]all my friends I'm [C]comin' there [G]too
Comin' for to [D]carry me [G]home` },
  { id: "down-in-the-valley", title: "Down in the Valley", artist: "Traditional", tags: ["strum","3/4","folk","campfire"], level: 1,
    key: "G", time: "3/4", bpm: 96, melody: [N("D4"), N("C5")], strum: "D – D U D U", strumTip: "Only two chords. Perfect for drilling the G to D change.",
    pick: "waltz", spotify: "Down in the Valley folk song",
    body: `# Verse 1
[G]Down in the valley, the valley so [D]low
Hang your head over, hear the wind [G]blow
Hear the wind blow, dear, hear the wind [D]blow
Hang your head over, hear the wind [G]blow

# Verse 2
[G]Roses love sunshine, violets love [D]dew
Angels in heaven know I love [G]you
Know I love you, dear, know I love [D]you
Angels in heaven know I love [G]you` },
  { id: "come-come-ye-saints", title: "Come, Come, Ye Saints", artist: "William Clayton (1846)", tags: ["strum","hymn"], level: 1,
    key: "G", time: "4/4", bpm: 76, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Simple campfire arrangement. Slow it down for the last line.",
    pick: "arp44", spotify: "Come Come Ye Saints hymn",
    body: `# Verse 1
[G]Come, come, ye Saints, no [C]toil nor labor [G]fear
But with joy [D]wend your [G]way
Though hard to you this [C]journey may ap[G]pear
Grace shall be [D]as your [G]day
'Tis better far for [C]us to [G]strive
Our useless cares from [D]us to drive
Do [G]this, and joy your [C]hearts will [G]swell
All is [D]well! All is [G]well!

# Verse 4
[G]And should we die be[C]fore our journey's [G]through
Happy day! [D]All is [G]well!
We then are free from [C]toil and sorrow [G]too
With the just [D]we shall [G]dwell!
But if our lives are [C]spared a[G]gain
To see the Saints their [D]rest obtain
Oh, [G]how we'll make this [C]chorus [G]swell
All is [D]well! All is [G]well!` },
  { id: "count-your-blessings", title: "Count Your Blessings", artist: "Johnson Oatman Jr. (1897)", tags: ["strum","hymn"], level: 1,
    key: "G", time: "4/4", bpm: 100, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Bouncy. Push the tempo a little on the chorus.",
    pick: "travis", spotify: "Count Your Blessings hymn",
    body: `# Verse 1
[G]When upon life's billows you are [C]tempest-[G]tossed
When you are discouraged, thinking [D]all is lost
[G]Count your many blessings, [C]name them one by [G]one
And it will sur[D]prise you what the Lord hath [G]done

# Chorus
[G]Count your blessings, [D]name them one by [G]one
Count your blessings, [Em]see what God hath [D]done
[G]Count your blessings, [C]name them one by [G]one
Count your many [D]blessings, see what God hath [G]done` },
  { id: "come-thou-fount", title: "Come, Thou Fount", artist: "Robert Robinson (1758)", tags: ["strum","3/4","hymn"], level: 2,
    key: "G", time: "3/4", bpm: 84, melody: [N("D4"), N("E5")], strum: "D – D U D U", strumTip: "Waltz feel. The middle section climbs, so lean into it.",
    pick: "arp34", spotify: "Come Thou Fount of Every Blessing",
    body: `# Verse 1
[G]Come, thou Fount of [C]every [G]blessing
Tune my heart to [D]sing thy [G]grace
Streams of mercy, [C]never [G]ceasing
Call for songs of [D]loudest [G]praise
[Em]Teach me some me[C]lodious [G]sonnet
Sung by flaming [Am]tongues a[D]bove
[G]Praise the mount! I'm [C]fixed up[G]on it
Mount of thy re[D]deeming [G]love` },
  { id: "home-on-the-range", title: "Home on the Range", artist: "Brewster Higley (1870s)", tags: ["strum","3/4","folk","campfire"], level: 2,
    key: "G", time: "3/4", bpm: 100, melody: [N("D4"), N("E5")], strum: "D – D U D U", strumTip: "Your first song with G7 and Am. Take the A7 to D slowly.",
    pick: "waltz", spotify: "Home on the Range",
    body: `# Verse 1
Oh [G]give me a [G7]home where the [C]buffalo [Am]roam
Where the [G]deer and the [Em]antelope [A7]play [D]
Where [G]seldom is [G7]heard a dis[C]couraging [Am]word
And the [G]skies are not [D]cloudy all [G]day

# Chorus
[D]Home, home on the [G]range
Where the deer and the [Em]antelope [A7]play [D]
Where [G]seldom is [G7]heard a dis[C]couraging [Am]word
And the [G]skies are not [D]cloudy all [G]day` },
  { id: "shenandoah", title: "Shenandoah", artist: "Traditional", tags: ["fingerpick","folk"], level: 2,
    key: "G", time: "4/4", bpm: 66, melody: [N("D4"), N("E5")], strum: "D – – – D – – – (one strum per chord, let it ring)", strumTip: "Slow ballad. Sounds best fingerpicked.",
    pick: "arp44", spotify: "Shenandoah folk song",
    body: `# Verse 1
Oh [G]Shenan[C]doah, [G]I long to [Em]hear you
[C]Away, you [G]rolling [D]river
Oh [G]Shenan[C]doah, [G]I long to [Em]hear you
A[C]way, I'm [G]bound a[Em]way
'Cross the [G]wide [D]Missou[G]ri

# Verse 2
Oh [G]Shenan[C]doah, [G]I love your [Em]daughter
[C]Away, you [G]rolling [D]river
For [G]her I'd [C]cross your [G]roaming [Em]waters
A[C]way, I'm [G]bound a[Em]way
'Cross the [G]wide [D]Missou[G]ri` },
  { id: "scarborough-fair", title: "Scarborough Fair", artist: "Traditional (English ballad)", tags: ["fingerpick","3/4","folk"], level: 2,
    key: "Am", time: "3/4", bpm: 88, melody: [N("E4"), N("E5")], strum: "D – D U D U", strumTip: "A minor-key song. Am is home base.",
    pick: "arp34", spotify: "Scarborough Fair traditional",
    body: `# Verse 1
[Am]Are you going to [G]Scarborough [Am]Fair?
[C]Parsley, [Am]sage, rose[D]mary and [Am]thyme
Re[C]member [G]me to one who lives [Em]there [D]
[Am]She once was a [G]true love of [Am]mine

# Verse 2
[Am]Tell her to make me a [G]cambric [Am]shirt
[C]Parsley, [Am]sage, rose[D]mary and [Am]thyme
With[C]out any [G]seam or fine needle[Em]work [D]
[Am]Then she'll be a [G]true love of [Am]mine` },
  { id: "i-know-my-redeemer", title: "I Know That My Redeemer Lives", artist: "Samuel Medley (1775)", tags: ["strum","hymn"], level: 2,
    key: "G", time: "4/4", bpm: 92, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Simple campfire arrangement. Strong and steady.",
    pick: "pinch44", spotify: "I Know That My Redeemer Lives hymn",
    body: `# Verse 1
I [G]know that my Re[C]deemer [G]lives
What comfort this sweet [D]sentence gives!
He [G]lives, he lives, who [C]once was [G]dead
He lives, my [D]ever-living [G]Head` },
  { id: "be-still-my-soul", title: "Be Still, My Soul", artist: "Katharina von Schlegel, tr. Jane Borthwick", tags: ["fingerpick","hymn"], level: 2,
    key: "G", time: "4/4", bpm: 70, melody: [N("B3"), N("E5")], strum: "D – – – D – D U", strumTip: "Gentle. Fingerpicking fits it best.",
    pick: "pinch44", spotify: "track:2jzshaCeXRHop8UqHvPwMu",
    body: `# Verse 1
[G]Be still, my [C]soul: The [G]Lord is on thy [D]side
[G]With patience [C]bear thy [G]cross of [D]grief or [G]pain
Leave to thy [C]God to [G]order and pro[D]vide
[G]In ev'ry [C]change he [G]faithful [D]will re[G]main
Be still, my [Em]soul: Thy [Am]best, thy heav'nly [D]Friend
[G]Thru thorny [C]ways leads [G]to a [D]joyful [G]end

# Verse 2
[G]Be still, my [C]soul: Thy [G]God doth under[D]take
[G]To guide the [C]future [G]as he has the [D]past
Thy hope, thy [C]confi[G]dence let nothing [D]shake
[G]All now mys[C]terious [G]shall be [D]bright at [G]last
Be still, my [Em]soul: The [Am]waves and winds still [D]know
[G]His voice who [C]ruled them [G]while he [D]dwelt be[G]low` },
  { id: "i-stand-all-amazed", title: "I Stand All Amazed", artist: "Charles H. Gabriel (1905)", tags: ["strum","hymn"], level: 2,
    key: "G", time: "4/4", bpm: 84, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Let the chorus open up. Slow down on the last line.",
    pick: "arp44", spotify: "track:0L2DHIcRbNHl8ziCGW7dp9",
    body: `# Verse 1
I [G]stand all a[C]mazed at the [G]love Jesus offers [D]me
Con[G]fused at the [C]grace that so [G]fully he [D]proffers [G]me
I [G]tremble to [C]know that for [G]me he was cruci[D]fied
That for [G]me, a [C]sinner, he [G]suffered, he [D]bled and [G]died

# Chorus
Oh, it is [C]wonderful that [G]he should care for [D]me
E[G]nough to [D]die for [G]me!
Oh, it is [C]wonderful, [G]wonderful [D]to [G]me!` },
  { id: "nearer-my-god", title: "Nearer, My God, to Thee", artist: "Sarah Flower Adams (1841)", tags: ["fingerpick","3/4","hymn"], level: 2,
    key: "G", time: "3/4", bpm: 76, melody: [N("D4"), N("D5")], strum: "D – D U D U", strumTip: "Slow 3/4. Lovely with the waltz pattern.",
    pick: "waltz", spotify: "track:0pjTwdLA7TA3A0o7SCJMYL",
    body: `# Verse 1
[G]Nearer, my [C]God, to [G]thee
[D]Nearer to [G]thee!
E'en though it [C]be a [G]cross
[D]That raiseth [G]me
Still all my [C]song shall [G]be
[Em]Nearer, my [D]God, to thee
[G]Nearer, my [C]God, to [G]thee
[D]Nearer to [G]thee!

# Verse 2
[G]Though like the [C]wander[G]er
[D]The sun gone [G]down
Darkness be [C]over [G]me
[D]My rest a [G]stone
Yet in my [C]dreams I'd [G]be
[Em]Nearer, my [D]God, to thee
[G]Nearer, my [C]God, to [G]thee
[D]Nearer to [G]thee!` },
  { id: "simple-gifts", title: "Simple Gifts", artist: "Joseph Brackett (1848)", tags: ["fingerpick","folk"], level: 2,
    key: "G", time: "4/4", bpm: 88, melody: [N("D4"), N("E5")], strum: "D – D U – U D U", strumTip: "Light and bouncy. Great for Travis picking.",
    pick: "travis", spotify: "Simple Gifts Shaker hymn",
    body: `# Verse
'Tis the [G]gift to be simple, 'tis the gift to be [D]free
'Tis the gift to come [D]down where we [Em]ought to [D]be
And [G]when we find ourselves in the [C]place just [G]right
'Twill be [Em]in the valley of [D]love and de[G]light

# Chorus
When true sim[G]plicity is [D]gained
To bow and to [D]bend we shan't be a[G]shamed
To [G]turn, turn will be our de[C]light
Till by [G]turning, [Em]turning we [D]come 'round [G]right` },
  { id: "danny-boy", title: "Danny Boy", artist: "Fred Weatherly (1913)", tags: ["fingerpick"], level: 3,
    key: "G", time: "4/4", bpm: 60, melody: [N("D4"), N("G5")], strum: "Fingerpick, or one gentle strum per chord", strumTip: "Big range. Perfect test for the range buttons.",
    pick: "arp44", spotify: "track:18wvemmpIyhFfNWcZxL1pV",
    body: `# Verse 1
Oh [G]Danny boy, the [G7]pipes, the pipes are [C]calling
From [G]glen to glen, and [Em]down the [A7]mountain [D]side
The [G]summer's gone, and [G7]all the roses [C]falling
'Tis [G]you, 'tis [Em]you must [D]go and I must [G]bide

# Verse 2
But come ye [D]back when [C]summer's in the [G]meadow
Or when the [Em]valley's [A]hushed and white with [D]snow
'Tis I'll be [G]here in [G7]sunshine or in [C]shadow
Oh Danny [G]boy, oh [Em]Danny [D]boy, I love you [G]so` },
];

/* chord presets for the practice tools */
const CHORD_PRESETS = {
  "Starter four": ["G","C","D","Em"],
  "Minor + A": ["Am","A","E","Em"],
  "Sevens": ["G7","A7","D7","E7","B7","C7"],
  "Campfire colors": ["Cadd9","Dsus4","Em7","G","Dsus2","Asus2"],
  "Power chords": ["E5","A5","G5","D5","C5","F5"],
  "Barre boss": ["F","Bm","F#m","Bb","C#m"],
};

/* ---------------- the Path ----------------
   step types:
   text · chords(list) · tool(tuner|metro, bpm) · game(flash|rush|quiz, chords, bpm, beats, secs)
   song(pick: [titles from your library], fallback: built-in id, mode: play|sing|memory)
   goal(pick, fallback, min) — rate the song; the lesson finishes at min% or after 3 days of tries
   check(md) — a quick self check
   Lessons are sized for one evening (10 to 20 min). */
const ROSTERS = {
  ch1: ["Riptide", "Breakeven", "I Will Wait"],
  ch2: ["Can't Help Falling in Love", "Little Do You Know", "Thank God"],
  ch3: ["The Only Exception", "All The Small Things", "Let Her Go"],
  ch4: ["Hey There Delilah", "Fuentes de Ortiz", "Fast Car"],
  ch5: ["Shape of You", "Hasta la Raíz", "a thousand years"],
};

const PATH = [
  { id: "ch0", title: "Foundations", icon: "seed", blurb: "Open chords, steady strumming, first fingerpicking, capo basics.", testOut: true, roster: [],
    builtins: ["amazing-grace", "down-in-the-valley", "red-river-valley"],
    lessons: [
      { id: "u1l1", title: "Tune up & hold it right", mins: 8, steps: [
        { t: "text", md: "Guitar body on your right leg, neck tilted a little up. Thumb behind the neck. Press right behind the fret wire, not on top of it." },
        { t: "tool", tool: "tuner", md: "Tune all six strings, low to high: E A D G B E. Each box turns green when it's in." },
        { t: "check", md: "Every open string rings clean and in tune." } ] },
      { id: "u1l2", title: "Em and G", mins: 10, steps: [
        { t: "chords", list: ["Em","G"], md: "Em is the easiest chord on guitar. G is the campfire king. Strum each four times and check every string rings." },
        { t: "game", game: "flash", chords: ["Em","G"], bpm: 60, beats: 4, secs: 60, md: "Switch every 4 beats. Miss a change? Keep strumming and catch the next one." } ] },
      { id: "u1l3", title: "Add C and D", mins: 12, steps: [
        { t: "chords", list: ["C","D"], md: "C stretches your fingers, D is a little triangle. Skip the strings marked with an x." },
        { t: "game", game: "flash", chords: ["G","C","G","D"], order: "seq", bpm: 60, beats: 4, secs: 90, md: "G to C, G to D, in order." } ] },
      { id: "u1l4", title: "Your first song", mins: 15, boss: true, steps: [
        { t: "song", pick: [], fallback: "down-in-the-valley", mode: "sing", md: "Two chords, waltz feel. Sing it or hum it." },
        { t: "goal", pick: [], fallback: "amazing-grace", min: 80, md: "Amazing Grace, start to finish. Rate it after two run-throughs." } ] },
      { id: "u2l1", title: "Steady downstrums", mins: 10, steps: [
        { t: "tool", tool: "metro", bpm: 70, md: "Down strum on every click on G. Your hand is a pendulum, it never stops." },
        { t: "game", game: "flash", chords: ["G","C"], bpm: 70, beats: 4, secs: 60, md: "Same thing, switching every 4 clicks." } ] },
      { id: "u2l2", title: "The campfire strum", mins: 12, steps: [
        { t: "text", md: "D – D U – U D U. Your hand goes down-up the whole time; you skip the strings on the dashes." },
        { t: "tool", tool: "metro", bpm: 60, md: "Practice it on G at 60. Say it out loud: down, down-up, up-down-up." },
        { t: "song", pick: [], fallback: "red-river-valley", mode: "sing", md: "Use it on Red River Valley." } ] },
      { id: "u2l3", title: "Boom-chick", mins: 12, boss: true, steps: [
        { t: "text", md: "Pick the lowest note of the chord, then strum. Bass, strum, bass, strum." },
        { t: "song", pick: [], fallback: "oh-susanna", md: "Oh! Susanna, boom-chick style." },
        { t: "goal", pick: [], fallback: "swing-low", min: 80, md: "Swing Low with the campfire strum." } ] },
      { id: "u3l1", title: "Am, A and E", mins: 12, steps: [
        { t: "chords", list: ["Am","A","E"], md: "Am and E are the same shape moved over one string." },
        { t: "game", game: "quiz", chords: ["Am","A","E","Em","G","C","D"], md: "Name that shape." } ] },
      { id: "u3l2", title: "Seventh chords", mins: 12, steps: [
        { t: "chords", list: ["G7","A7","D7","E7"], md: "Sevens add pull toward the next chord. They make songs sound finished." },
        { t: "song", pick: [], fallback: "home-on-the-range", md: "Home on the Range uses G7, Am and A7." } ] },
      { id: "u3l3", title: "A minor-key song", mins: 12, boss: true, steps: [
        { t: "goal", pick: [], fallback: "scarborough-fair", min: 80, md: "Scarborough Fair." } ] },
      { id: "u4l1", title: "Thumb on the bass", mins: 12, steps: [
        { t: "text", md: "Thumb plays the low strings. Index on G, middle on B, ring on high e. Each finger owns one string." },
        { t: "song", pick: [], fallback: "amazing-grace", mode: "pick", md: "Amazing Grace with the 3/4 arpeggio. Slow is fine." } ] },
      { id: "u4l2", title: "Travis picking, first look", mins: 14, boss: true, steps: [
        { t: "text", md: "Thumb alternates between two bass strings like a heartbeat. Get the thumb steady alone for a full minute first." },
        { t: "goal", pick: [], fallback: "shenandoah", min: 80, md: "Shenandoah, fingerpicked." } ] },
      { id: "u5l1", title: "Put it in your key", mins: 10, steps: [
        { t: "text", md: "In any song, open Transpose and turn on a singer. The key moves to fit that voice and the shapes stay easy." },
        { t: "song", pick: [], fallback: "danny-boy", md: "Danny Boy has a huge range. Try your range, then Ri's." } ] },
      { id: "u5l2", title: "Barre chord intro", mins: 12, boss: true, steps: [
        { t: "chords", list: ["F","Bm"], md: "Barre chords unlock every key without a capo. Ten clean F chords a day and they'll come." },
        { t: "game", game: "flash", chords: ["C","F"], bpm: 50, beats: 4, secs: 60, md: "C to F. Speed over perfection for now." } ] },
    ],
    side: [] },

  { id: "ch1", title: "Rhythm Engine", icon: "drum", blurb: "Strumming that feels good: accents, muting, syncopation, steady tempo.", roster: ROSTERS.ch1,
    builtins: ["oh-susanna", "count-your-blessings"],
    lessons: [
      { id: "c1l1", title: "Pendulum and accents", mins: 14, steps: [
        { t: "text", md: "Keep your hand swinging down-up on every 8th note, even when you miss the strings. Now hit beats 2 and 4 a little harder. That backbeat accent is what makes strumming groove instead of plod." },
        { t: "tool", tool: "metro", bpm: 72, md: "On G: steady 8ths, accent 2 and 4. Two minutes." },
        { t: "game", game: "flash", chords: ["G","C","D","Em"], bpm: 72, beats: 4, secs: 90, md: "Keep the accents while the chords change." },
        { t: "song", pick: [], fallback: "count-your-blessings", mode: "sing", md: "Sing it while you keep the accents. If singing breaks the strum, hum first." } ] },
      { id: "c1l2", title: "Muting and the chunk", mins: 15, steps: [
        { t: "text", md: "Strum, then on beats 2 and 4 slap the strings with the side of your strumming hand as it comes down. That percussive \"chk\" sounds like a snare. Fret hand stays in the chord." },
        { t: "tool", tool: "metro", bpm: 66, md: "On Em: strum, chk, strum, chk. Then G. Then C." },
        { t: "game", game: "flash", chords: ["Em","C","G","D"], order: "seq", bpm: 70, beats: 4, secs: 90, md: "Em C G D with the chunk on 2 and 4." },
        { t: "song", pick: ["I Will Wait"], fallback: "oh-susanna", md: "Chunk your way through it." } ] },
      { id: "c1l3", title: "Syncopation and the island strum", mins: 16, steps: [
        { t: "text", md: "D – D U – U D U skips the down on beat 3, so the up before it ties over. That tie is the syncopation. Count it: 1, 2 &, (3) &, 4 &." },
        { t: "tool", tool: "metro", bpm: 60, md: "Island strum on Am. Count out loud for a minute, then stop counting and feel it." },
        { t: "game", game: "flash", chords: ["Am","G","C"], order: "seq", bpm: 66, beats: 8, secs: 90, md: "Am G C, two bars each, island strum." },
        { t: "song", pick: ["Riptide"], fallback: "swing-low", mode: "sing", md: "Strum and sing it." } ] },
      { id: "c1l4", title: "Tempo ladder", mins: 18, boss: true, steps: [
        { t: "text", md: "Play a song at a tempo where it's clean, then bump the metronome 5 bpm. Miss more than twice? Drop back 5. Your goal is the song's real tempo." },
        { t: "tool", tool: "metro", bpm: 70, md: "Ladder up from 70 on the campfire strum." },
        { t: "goal", pick: ["Riptide", "Breakeven"], fallback: "oh-susanna", min: 80, md: "Rate the song at full tempo." } ] },
    ],
    side: [
      { id: "c1s1", title: "Muting drill", mins: 6, steps: [{ t: "tool", tool: "metro", bpm: 80, md: "Two minutes of strum-chunk on every chord in the Starter four. Fast as you can stay clean." }] },
      { id: "c1s2", title: "Play one from memory", mins: 8, steps: [{ t: "song", pick: [], fallback: "red-river-valley", mode: "memory", md: "Play a whole verse with the sheet hidden. Peek only if you're truly stuck." }] },
    ] },

  { id: "ch2", title: "Sing While You Play", icon: "mic", blurb: "Strum on autopilot so your voice is free. Lots of duets with Ri.", roster: ROSTERS.ch2,
    builtins: ["down-in-the-valley", "come-come-ye-saints"],
    lessons: [
      { id: "c2l1", title: "Autopilot strum", mins: 14, steps: [
        { t: "text", md: "Singing and strumming fight because both want your attention. Fix: make the strum boring. Strum the campfire pattern while you count out loud, then while you talk about your day, then while you hum." },
        { t: "tool", tool: "metro", bpm: 70, md: "Strum G and talk out loud for a full minute without the strum breaking." },
        { t: "song", pick: [], fallback: "down-in-the-valley", mode: "sing", md: "Hum the melody first, then add the words." } ] },
      { id: "c2l2", title: "Land the words on the beat", mins: 15, steps: [
        { t: "text", md: "Find the one word in each line that lands on a chord change. Those are your anchors. Your hand and voice meet there; everything between can float." },
        { t: "song", pick: ["Can't Help Falling in Love"], fallback: "amazing-grace", mode: "sing", md: "Say the anchor words out loud while strumming, then sing the whole line." } ] },
      { id: "c2l3", title: "Duet night", mins: 18, boss: true, steps: [
        { t: "text", md: "You hold the guitar and harmony line, Ri takes the melody or the second verse. If a key fits one of you badly, open Transpose and turn on both singers to find the middle ground." },
        { t: "song", pick: ["Little Do You Know", "Thank God"], fallback: "come-come-ye-saints", mode: "sing", md: "Sing it together once for fun." },
        { t: "goal", pick: ["Little Do You Know", "Thank God"], fallback: "come-come-ye-saints", min: 80, md: "Rate it, with the singing slider on." } ] },
    ],
    side: [
      { id: "c2s1", title: "Sing-along sprint", mins: 8, steps: [{ t: "song", pick: [], fallback: "swing-low", mode: "sing", md: "Pick any song you can already play and sing every word." }] },
    ] },

  { id: "ch3", title: "Chords II + Band Mode", icon: "chord", blurb: "Campfire color chords for acoustic, power chords and palm muting for the band.", roster: ROSTERS.ch3,
    builtins: ["be-still-my-soul", "scarborough-fair"],
    lessons: [
      { id: "c3l1", title: "Anchor fingers and campfire voicings", mins: 15, steps: [
        { t: "text", md: "Keep your ring and pinky planted on the B and high e strings at fret 3. Now G, Cadd9, Dsus4 and Em7 are tiny moves of the first two fingers. This is the sound of half the acoustic songs you like." },
        { t: "chords", list: ["G","Cadd9","Dsus4","Em7"], md: "Learn the four shapes." },
        { t: "game", game: "flash", chords: ["G","Cadd9","Dsus4","Em7"], bpm: 70, beats: 4, secs: 90, md: "Flow between them." } ] },
      { id: "c3l2", title: "Power chords and palm muting", mins: 16, steps: [
        { t: "text", md: "A power chord is just two or three strings: root and fifth. Rest the edge of your strumming hand on the strings right at the bridge for that chuggy palm mute." },
        { t: "chords", list: ["E5","A5","G5","D5","C5"], md: "Same shape everywhere: root on the 6th or 5th string." },
        { t: "game", game: "flash", chords: ["G5","D5","E5","C5"], order: "seq", bpm: 100, beats: 4, secs: 90, md: "Palm-muted 8ths." },
        { t: "song", pick: ["All The Small Things"], fallback: "oh-susanna", md: "Band song time." } ] },
      { id: "c3l3", title: "Barre chords the easy way", mins: 18, boss: true, steps: [
        { t: "text", md: "Start with Fmaj7 (no barre), then the mini F (four strings, small barre), then the full F. Roll your first finger slightly onto its bony side." },
        { t: "chords", list: ["Fmaj7","F","Bm","F#m"], md: "Build up in that order." },
        { t: "game", game: "flash", chords: ["C","F","Am","G"], order: "seq", bpm: 60, beats: 8, secs: 90, md: "C F Am G with whatever F you can." },
        { t: "goal", pick: ["The Only Exception", "Let Her Go"], fallback: "be-still-my-soul", min: 80, md: "Rate it." } ] },
    ],
    side: [
      { id: "c3s1", title: "Chord memory drill", mins: 6, steps: [{ t: "game", game: "quiz", chords: ["Cadd9","Dsus4","Em7","E5","A5","F","Bm"], md: "Name that shape, new chords only." }] },
    ] },

  { id: "ch4", title: "Fingerpicking II", icon: "hand", blurb: "Real picked parts: Travis, melody notes, and picking verses with strummed choruses.", roster: ROSTERS.ch4,
    builtins: ["simple-gifts", "nearer-my-god", "be-still-my-soul"],
    lessons: [
      { id: "c4l1", title: "Travis picking for real", mins: 16, steps: [
        { t: "text", md: "Thumb only, alternating bass, for a full minute on C. Then add the index on the & of 2 and 4. Thumb never waits for the fingers." },
        { t: "tool", tool: "metro", bpm: 60, md: "Thumb alone at 60, then fingers. Then 70." },
        { t: "song", pick: ["Hey There Delilah"], fallback: "simple-gifts", mode: "pick", md: "Set the view to Fingerpick with the Travis pattern." } ] },
      { id: "c4l2", title: "Melody on top", mins: 16, steps: [
        { t: "text", md: "Pinch the bass with the highest note you can hear in the tune on the downbeat. Even one melody note per bar makes picking sound like the song instead of a pattern." },
        { t: "song", pick: [], fallback: "nearer-my-god", mode: "pick", md: "Use the Bass + pinch pattern and aim your ring finger at the melody note." } ] },
      { id: "c4l3", title: "Pick the verse, strum the chorus", mins: 18, boss: true, steps: [
        { t: "text", md: "Fingerpick the verses quietly, then strum the chorus. The contrast is what makes an acoustic arrangement feel big." },
        { t: "goal", pick: ["Fuentes de Ortiz", "Fast Car", "Hey There Delilah"], fallback: "be-still-my-soul", min: 80, md: "Rate it." } ] },
    ],
    side: [
      { id: "c4s1", title: "Spider walk + picking warmup", mins: 6, steps: [{ t: "tool", tool: "metro", bpm: 70, md: "Frets 1-2-3-4 on every string with alternating fingers, then an arpeggio on every Starter four chord." }] },
    ] },

  { id: "ch5", title: "Keys, Capo & Arranging", icon: "key", blurb: "Why songs repeat, moving them into your voice, and making them your own.", roster: ROSTERS.ch5,
    builtins: ["danny-boy", "i-stand-all-amazed"],
    lessons: [
      { id: "c5l1", title: "The number system", mins: 14, steps: [
        { t: "text", md: "In any key, the chords are numbered by the scale. In G: G is 1, C is 4, D is 5, Em is 6m. Thousands of songs are just 1 5 6m 4. Learn the numbers and every key is the same song." },
        { t: "game", game: "flash", chords: ["G","D","Em","C"], order: "seq", bpm: 72, beats: 8, secs: 60, md: "1 5 6m 4 in G." },
        { t: "game", game: "flash", chords: ["C","G","Am","F"], order: "seq", bpm: 72, beats: 8, secs: 60, md: "Now 1 5 6m 4 in C. Same feel, new key." } ] },
      { id: "c5l2", title: "Transpose to fit", mins: 15, steps: [
        { t: "text", md: "Open Transpose on a song, turn on your singer chip, then tap Easiest shapes a few times to cycle through capo options that keep it in range. Save the one you like." },
        { t: "song", pick: ["a thousand years"], fallback: "danny-boy", mode: "sing", md: "Find a key for you, then one for Ri. Save both." } ] },
      { id: "c5l3", title: "Your arrangement", mins: 20, boss: true, steps: [
        { t: "text", md: "Pick a song and decide four things: intro (a bar of picking?), verse feel, chorus feel, ending (slow strum and let it ring). Play it the same way three times." },
        { t: "goal", pick: ["Shape of You", "Hasta la Raíz", "a thousand years"], fallback: "i-stand-all-amazed", min: 80, md: "Rate your arrangement." } ] },
    ],
    side: [
      { id: "c5s1", title: "Record it", mins: 15, steps: [{ t: "text", md: "Record your arrangement in Reaper, one take. Listen back once. That's it." }] },
    ] },
];
