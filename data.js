/* =========================================================
   data.js — built-in songs (public domain only), lesson path,
   and practice chord groups.
   Song body format: "# Section" lines, chords inline like [G]word.
   melody = [lowest, highest] note of the tune as written (approx).
   ========================================================= */

const N = s => Theory.nameToMidi(s);

const BUILTIN_SONGS = [
  /* ---------------- SET 1: G, C, D, Em ---------------- */
  {
    id: "amazing-grace", title: "Amazing Grace", artist: "John Newton (1779)", set: 1,
    key: "G", time: "3/4", bpm: 80, melody: [N("D4"), N("D5")],
    strum: "D – D U D U", strumTip: "Waltz feel: big bass strum on 1, lighter strums on 2 and 3.",
    pick: "arp34", spotify: "Amazing Grace hymn acoustic",
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
Than [Em]when we'd [D]first be[G]gun`,
  },
  {
    id: "red-river-valley", title: "Red River Valley", artist: "Traditional", set: 1,
    key: "G", time: "4/4", bpm: 92, melody: [N("D4"), N("E5")],
    strum: "D – D U – U D U", strumTip: "Classic campfire strum. Keep your hand moving even on the misses.",
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
And the [G]grief you are [D]causing to [G]me`,
  },
  {
    id: "oh-susanna", title: "Oh! Susanna", artist: "Stephen Foster (1848)", set: 1,
    key: "G", time: "4/4", bpm: 110, melody: [N("D4"), N("E5")],
    strum: "B D B D (boom-chick)", strumTip: "Pick the bass note, then strum. Bass, strum, bass, strum.",
    pick: "travis", spotify: "Oh Susanna Stephen Foster",
    body: `# Verse 1
I [G]come from Alabama with a banjo on my [D]knee
I'm [G]going to Louisiana, my [D]true love for to [G]see
It [G]rained all night the day I left, the weather it was [D]dry
The [G]sun so hot I froze to death, Su[D]sanna, don't you [G]cry

# Chorus
Oh, Su[C]sanna, oh don't you cry for [G]me
For I [G]come from Alabama with a [D]banjo on my [G]knee`,
  },
  {
    id: "swing-low", title: "Swing Low, Sweet Chariot", artist: "Spiritual", set: 1,
    key: "G", time: "4/4", bpm: 72, melody: [N("B3"), N("D5")],
    strum: "D – D U – U D U", strumTip: "Slow and swingy. Let it breathe.",
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
Comin' for to [D]carry me [G]home`,
  },
  {
    id: "down-in-the-valley", title: "Down in the Valley", artist: "Traditional", set: 1,
    key: "G", time: "3/4", bpm: 96, melody: [N("D4"), N("C5")],
    strum: "D – D U D U", strumTip: "Only two chords. Perfect for drilling the G to D change.",
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
Angels in heaven know I love [G]you`,
  },
  {
    id: "come-come-ye-saints", title: "Come, Come, Ye Saints", artist: "William Clayton (1846)", set: 1,
    key: "G", time: "4/4", bpm: 76, melody: [N("D4"), N("E5")],
    strum: "D – D U – U D U", strumTip: "Simple campfire arrangement. Slow it down for the last line.",
    pick: "arp44", spotify: "Come Come Ye Saints",
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
All is [D]well! All is [G]well!`,
  },
  {
    id: "count-your-blessings", title: "Count Your Blessings", artist: "Johnson Oatman Jr. (1897)", set: 1,
    key: "G", time: "4/4", bpm: 100, melody: [N("D4"), N("E5")],
    strum: "D – D U – U D U", strumTip: "Bouncy. Push the tempo a little on the chorus.",
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
Count your many [D]blessings, see what God hath [G]done`,
  },

  /* ---------------- SET 2: adds Am, A7, G7, Em moves, 3/4 picking ---------------- */
  {
    id: "come-thou-fount", title: "Come, Thou Fount", artist: "Robert Robinson (1758)", set: 2,
    key: "G", time: "3/4", bpm: 84, melody: [N("D4"), N("E5")],
    strum: "D – D U D U", strumTip: "Waltz feel. The middle section climbs, so lean into it.",
    pick: "arp34", spotify: "Come Thou Fount of Every Blessing",
    body: `# Verse 1
[G]Come, thou Fount of [C]every [G]blessing
Tune my heart to [D]sing thy [G]grace
Streams of mercy, [C]never [G]ceasing
Call for songs of [D]loudest [G]praise
[Em]Teach me some me[C]lodious [G]sonnet
Sung by flaming [Am]tongues a[D]bove
[G]Praise the mount! I'm [C]fixed up[G]on it
Mount of thy re[D]deeming [G]love`,
  },
  {
    id: "home-on-the-range", title: "Home on the Range", artist: "Brewster Higley (1870s)", set: 2,
    key: "G", time: "3/4", bpm: 100, melody: [N("D4"), N("E5")],
    strum: "D – D U D U", strumTip: "Your first song with G7 and Am. Take the A7 to D slowly.",
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
And the [G]skies are not [D]cloudy all [G]day`,
  },
  {
    id: "shenandoah", title: "Shenandoah", artist: "Traditional", set: 2,
    key: "G", time: "4/4", bpm: 66, melody: [N("D4"), N("E5")],
    strum: "D – – – D – – – (one strum per chord, let it ring)", strumTip: "Slow ballad. Sounds best fingerpicked.",
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
'Cross the [G]wide [D]Missou[G]ri`,
  },
  {
    id: "scarborough-fair", title: "Scarborough Fair", artist: "Traditional (English ballad)", set: 2,
    key: "Am", time: "3/4", bpm: 88, melody: [N("E4"), N("E5")],
    strum: "D – D U D U", strumTip: "Your first minor-key song. Am is home base.",
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
[Am]Then she'll be a [G]true love of [Am]mine`,
  },
  {
    id: "i-know-my-redeemer", title: "I Know That My Redeemer Lives", artist: "Samuel Medley (1775)", set: 2,
    key: "G", time: "4/4", bpm: 92, melody: [N("D4"), N("E5")],
    strum: "D – D U – U D U", strumTip: "Simple campfire arrangement. Strong and steady.",
    pick: "pinch44", spotify: "I Know That My Redeemer Lives hymn",
    body: `# Verse 1
I [G]know that my Re[C]deemer [G]lives
What comfort this sweet [D]sentence gives!
He [G]lives, he lives, who [C]once was [G]dead
He lives, my [D]ever-living [G]Head`,
  },

  /* ---------------- SET 3: stretch ---------------- */
  {
    id: "danny-boy", title: "Danny Boy", artist: "Fred Weatherly (1913)", set: 3,
    key: "G", time: "4/4", bpm: 60, melody: [N("D4"), N("G5")],
    strum: "Fingerpick, or one gentle strum per chord", strumTip: "Big range. Perfect test for the range button.",
    pick: "arp44", spotify: "Danny Boy",
    body: `# Verse 1
Oh [G]Danny boy, the [G7]pipes, the pipes are [C]calling
From [G]glen to glen, and [Em]down the [A7]mountain [D]side
The [G]summer's gone, and [G7]all the roses [C]falling
'Tis [G]you, 'tis [Em]you must [D]go and I must [G]bide

# Verse 2
But come ye [D]back when [C]summer's in the [G]meadow
Or when the [Em]valley's [A]hushed and white with [D]snow
'Tis I'll be [G]here in [G7]sunshine or in [C]shadow
Oh Danny [G]boy, oh [Em]Danny [D]boy, I love you [G]so`,
  },
];

/* chord groups for practice tools */
const CHORD_GROUPS = {
  "Starter four": ["G","C","D","Em"],
  "Minor + A": ["Am","A","E","Em"],
  "Sevens": ["G7","A7","D7","E7","B7","C7"],
  "Pretty extras": ["Cadd9","Dsus2","Dsus4","Asus2","Cmaj7","Fmaj7"],
  "Barre boss": ["F","Bm","F#m","Bb"],
};

/* ---------------- lesson path ----------------
   step types: text, chords, tool(tuner|metro), game(flash|rush|quiz), song, check */
const PATH = [
  { id: "u1", title: "First Chords", icon: "🌱", lessons: [
    { id: "u1l1", title: "Tune up & hold it right", steps: [
      { t: "text", md: "Sit up, guitar body on your right leg, neck pointing a little up. Thumb behind the neck, not wrapped over the top. Press with fingertips right behind the fret wire, not on top of it." },
      { t: "tool", tool: "tuner", md: "Tune all six strings. Low to high: E A D G B E. Get each one green." },
      { t: "check", md: "Play each open string. Every one rings clean and sounds in tune." },
    ]},
    { id: "u1l2", title: "Em and G", steps: [
      { t: "chords", list: ["Em","G"], md: "Em is the easiest chord on guitar. G is the campfire king. Strum each 4 times, then check every string rings." },
      { t: "game", game: "flash", chords: ["Em","G"], bpm: 60, beats: 4, secs: 60, md: "Switch every 4 beats. If you miss a change, keep strumming and catch the next one." },
      { t: "check", md: "Em to G without stopping your strum hand." },
    ]},
    { id: "u1l3", title: "Add C and D", steps: [
      { t: "chords", list: ["C","D"], md: "C stretches your fingers, D is a little triangle. Only strum the strings that aren't marked with an X." },
      { t: "game", game: "rush", chords: ["G","C"], md: "One minute, G to C as many clean times as you can. Tap for each clean change. Beat it next time." },
      { t: "game", game: "rush", chords: ["G","D"], md: "Now G to D. Pro tip: keep your ring finger planted when it's in both chords." },
    ]},
    { id: "u1l4", title: "Your first song", boss: true, steps: [
      { t: "game", game: "flash", chords: ["G","C","D","Em"], bpm: 60, beats: 4, secs: 90, md: "Warm up with all four." },
      { t: "song", id: "down-in-the-valley", md: "Two chords, waltz feel. Play it start to finish. Sing if you can, hum if you can't." },
      { t: "song", id: "amazing-grace", md: "Boss level: Amazing Grace. Mark it 'nailed it' when you get through a verse without stopping." },
    ]},
  ]},
  { id: "u2", title: "Rhythm", icon: "🥁", lessons: [
    { id: "u2l1", title: "Steady downstrums", steps: [
      { t: "tool", tool: "metro", bpm: 70, md: "Metronome at 70. Down strum on every click on a G chord. Your hand is a pendulum, it never stops." },
      { t: "game", game: "flash", chords: ["G","C"], bpm: 70, beats: 4, secs: 60, md: "Same thing, switching chords every 4 clicks." },
    ]},
    { id: "u2l2", title: "The campfire strum", steps: [
      { t: "text", md: "The strum that plays a thousand songs: D – D U – U D U. Your hand goes down-up the whole time, you just skip hitting the strings on the dashes." },
      { t: "tool", tool: "metro", bpm: 60, md: "Practice it on G at 60. Say it out loud: down, down-up, up-down-up." },
      { t: "song", id: "red-river-valley", md: "Use it on Red River Valley." },
    ]},
    { id: "u2l3", title: "Boom-chick", boss: true, steps: [
      { t: "text", md: "Pick the bass note of the chord (the lowest string you're holding), then strum. Bass, strum, bass, strum. Instant old-timey sound." },
      { t: "song", id: "oh-susanna", md: "Oh! Susanna, boom-chick style." },
      { t: "song", id: "swing-low", md: "Boss level: Swing Low with the campfire strum. Your wife sings, you hold it down." },
    ]},
  ]},
  { id: "u3", title: "Minor & Sevens", icon: "🌙", lessons: [
    { id: "u3l1", title: "Am, A and E", steps: [
      { t: "chords", list: ["Am","A","E"], md: "Am and E are the same shape moved over one string. Learn one, get both." },
      { t: "game", game: "rush", chords: ["Am","E"], md: "Am to E. Just slide the whole shape." },
      { t: "game", game: "quiz", md: "Name that shape." },
    ]},
    { id: "u3l2", title: "Seventh chords", steps: [
      { t: "chords", list: ["G7","A7","D7","E7"], md: "Sevens add tension that wants to resolve. They make songs sound finished." },
      { t: "song", id: "home-on-the-range", md: "Home on the Range uses G7, Am and A7." },
    ]},
    { id: "u3l3", title: "Minor key song", boss: true, steps: [
      { t: "song", id: "scarborough-fair", md: "Boss level: Scarborough Fair. Your first minor song." },
    ]},
  ]},
  { id: "u4", title: "Fingerpicking", icon: "🖐️", lessons: [
    { id: "u4l1", title: "Thumb on the bass", steps: [
      { t: "text", md: "Thumb plays the low strings (bass). Index on G, middle on B, ring on high e. Each finger owns one string." },
      { t: "text", md: "Open any song, switch to the Fingerpick view, and you'll see a tab for every chord built from that exact shape." },
      { t: "song", id: "amazing-grace", md: "Play Amazing Grace with the 3/4 arpeggio. Slow is fine." },
    ]},
    { id: "u4l2", title: "Travis picking", boss: true, steps: [
      { t: "text", md: "Travis picking: your thumb alternates between two bass strings like a heartbeat while your fingers fill in between. Get the thumb steady first, alone, for a full minute." },
      { t: "song", id: "red-river-valley", md: "Red River Valley in Fingerpick view uses Travis. Just the thumb first, then add fingers." },
      { t: "song", id: "shenandoah", md: "Boss level: Shenandoah, fingerpicked." },
    ]},
  ]},
  { id: "u5", title: "Keys & Capo", icon: "🎚️", lessons: [
    { id: "u5l1", title: "Put it in your key", steps: [
      { t: "text", md: "A capo lets you play easy shapes in a different key. In any song, tap 'My range' and the app moves the key to fit your voice, then picks a capo so the shapes stay easy." },
      { t: "song", id: "danny-boy", md: "Danny Boy has a huge range. Try 'My range', then 'Ri's range', and hear the difference." },
    ]},
    { id: "u5l2", title: "Barre chord intro", boss: true, steps: [
      { t: "chords", list: ["F","Bm"], md: "Barre chords unlock every key without a capo. They hurt at first. Ten clean F chords a day and they'll come." },
      { t: "game", game: "rush", chords: ["C","F"], md: "C to F. Don't worry about a perfect F yet, just get faster." },
    ]},
  ]},
];
