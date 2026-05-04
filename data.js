/* ===== Scripture Quest — Bible content =====
 * Translation: World English Bible (WEB), public domain.
 * Each "lesson" is a focused passage (Duolingo-bite-sized).
 * Verse numbers are encoded as { v: n, t: "text" } objects.
 */

const PLANS = [
  {
    id: "warrior",
    name: "Warrior's Heart",
    emoji: "⚔️",
    color: "#ff7a18",
    desc: "Courage, kingdom, kings — the David arc.",
    lessons: [
      {
        ref: "1 Samuel 17:32-37",
        theme: "Don't measure the giant. Measure the God you serve.",
        prompt: "Where is fear holding you back? What does David's confidence rest on?",
        verses: [
          { v: 32, t: "David said to Saul, \"Let no man's heart fail because of him. Your servant will go and fight with this Philistine.\"" },
          { v: 33, t: "Saul said to David, \"You are not able to go against this Philistine to fight with him; for you are but a youth, and he a man of war from his youth.\"" },
          { v: 34, t: "David said to Saul, \"Your servant was keeping his father's sheep; and when a lion or a bear came and took a lamb out of the flock,\"" },
          { v: 35, t: "\"I went out after him, and struck him, and rescued it out of his mouth. When he arose against me, I caught him by his beard, and struck him, and killed him.\"" },
          { v: 36, t: "\"Your servant struck both the lion and the bear. This uncircumcised Philistine shall be as one of them, since he has defied the armies of the living God.\"" },
          { v: 37, t: "David said, \"Yahweh, who delivered me out of the paw of the lion, and out of the paw of the bear, will deliver me out of the hand of this Philistine.\" Saul said to David, \"Go; and Yahweh shall be with you.\"" }
        ]
      },
      {
        ref: "1 Samuel 17:45-49",
        theme: "The battle belongs to the Lord.",
        prompt: "What 'sword and spear' do you tend to trust in instead of God?",
        verses: [
          { v: 45, t: "Then David said to the Philistine, \"You come to me with a sword, with a spear, and with a javelin; but I come to you in the name of Yahweh of Armies, the God of the armies of Israel, whom you have defied.\"" },
          { v: 46, t: "\"Today, Yahweh will deliver you into my hand. I will strike you, and take your head from off you. I will give the dead bodies of the army of the Philistines today to the birds of the sky, and to the wild animals of the earth; that all the earth may know that there is a God in Israel,\"" },
          { v: 47, t: "\"and that all this assembly may know that Yahweh doesn't save with sword and spear; for the battle is Yahweh's, and he will give you into our hand.\"" },
          { v: 48, t: "When the Philistine arose, and walked and came near to meet David, David hurried, and ran toward the army to meet the Philistine." },
          { v: 49, t: "David put his hand in his bag, took a stone, and slung it, and struck the Philistine in his forehead. The stone sank into his forehead, and he fell on his face to the earth." }
        ]
      },
      {
        ref: "Psalm 18:1-6",
        theme: "God is your rock.",
        prompt: "What's pressing on you right now? Cry out like David did.",
        verses: [
          { v: 1, t: "I love you, Yahweh, my strength." },
          { v: 2, t: "Yahweh is my rock, my fortress, and my deliverer; my God, my rock, in whom I take refuge; my shield, and the horn of my salvation, my high tower." },
          { v: 3, t: "I call on Yahweh, who is worthy to be praised; and I am saved from my enemies." },
          { v: 4, t: "The cords of death surrounded me. The floods of ungodliness made me afraid." },
          { v: 5, t: "The cords of Sheol were around me. The snares of death came on me." },
          { v: 6, t: "In my distress I called on Yahweh, and cried to my God. He heard my voice out of his temple. My cry before him came into his ears." }
        ]
      },
      {
        ref: "Psalm 27:1-6",
        theme: "Whom shall I fear?",
        prompt: "Name one fear by name, then preach this Psalm to it.",
        verses: [
          { v: 1, t: "Yahweh is my light and my salvation. Whom shall I fear? Yahweh is the strength of my life. Of whom shall I be afraid?" },
          { v: 2, t: "When evildoers came at me to eat up my flesh, even my adversaries and my foes, they stumbled and fell." },
          { v: 3, t: "Though an army should encamp against me, my heart shall not fear. Though war should rise against me, even then I will be confident." },
          { v: 4, t: "One thing I have asked of Yahweh, that I will seek after: that I may dwell in the house of Yahweh all the days of my life, to see Yahweh's beauty, and to inquire in his temple." },
          { v: 5, t: "For in the day of trouble, he will keep me secretly in his pavilion. In the secret place of his tabernacle, he will hide me. He will lift me up on a rock." },
          { v: 6, t: "Now my head will be lifted up above my enemies around me. I will offer sacrifices of joy in his tent. I will sing, yes, I will sing praises to Yahweh." }
        ]
      },
      {
        ref: "2 Samuel 22:30-37",
        theme: "God trains your hands for the fight.",
        prompt: "What skill or struggle do you need God to train you in this season?",
        verses: [
          { v: 30, t: "For by you, I run against a troop. By my God, I leap over a wall." },
          { v: 31, t: "As for God, his way is perfect. Yahweh's word is tested. He is a shield to all those who take refuge in him." },
          { v: 32, t: "For who is God, besides Yahweh? Who is a rock, besides our God?" },
          { v: 33, t: "God is my strong fortress. He makes my way perfect." },
          { v: 34, t: "He makes his feet like hinds' feet, and sets me on my high places." },
          { v: 35, t: "He teaches my hands to war, so that my arms bend a bow of bronze." },
          { v: 36, t: "You have also given me the shield of your salvation. Your gentleness has made me great." },
          { v: 37, t: "You have enlarged my steps under me. My feet have not slipped." }
        ]
      },
      {
        ref: "Joshua 1:5-9",
        theme: "Be strong and courageous.",
        prompt: "Where do you need to step into ground God has already promised you?",
        verses: [
          { v: 5, t: "No man will be able to stand before you all the days of your life. As I was with Moses, so I will be with you. I will not fail you nor forsake you." },
          { v: 6, t: "Be strong and courageous; for you shall cause this people to inherit the land which I swore to their fathers to give them." },
          { v: 7, t: "Only be strong and very courageous, to observe to do according to all the law which Moses my servant commanded you. Don't turn from it to the right hand or to the left, that you may have good success wherever you go." },
          { v: 8, t: "This book of the law shall not depart out of your mouth, but you shall meditate on it day and night, that you may observe to do according to all that is written in it; for then you shall make your way prosperous, and then you shall have good success." },
          { v: 9, t: "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for Yahweh your God is with you wherever you go." }
        ]
      }
    ]
  },

  {
    id: "identity",
    name: "Built Different",
    emoji: "⚡",
    color: "#4cc9ff",
    desc: "Who you are in Christ. New creation, new name.",
    lessons: [
      {
        ref: "Romans 8:1-6",
        theme: "No condemnation.",
        prompt: "What lies has shame been telling you? Replace them with verse 1.",
        verses: [
          { v: 1, t: "There is therefore now no condemnation to those who are in Christ Jesus, who don't walk according to the flesh, but according to the Spirit." },
          { v: 2, t: "For the law of the Spirit of life in Christ Jesus made me free from the law of sin and of death." },
          { v: 3, t: "For what the law couldn't do, in that it was weak through the flesh, God did, sending his own Son in the likeness of sinful flesh and for sin, he condemned sin in the flesh," },
          { v: 4, t: "that the ordinance of the law might be fulfilled in us, who walk not after the flesh, but after the Spirit." },
          { v: 5, t: "For those who live according to the flesh set their minds on the things of the flesh, but those who live according to the Spirit, the things of the Spirit." },
          { v: 6, t: "For the mind of the flesh is death, but the mind of the Spirit is life and peace;" }
        ]
      },
      {
        ref: "Romans 8:31-39",
        theme: "If God is for us...",
        prompt: "What's the worst case you fear? Read v.38-39 over it.",
        verses: [
          { v: 31, t: "What then shall we say about these things? If God is for us, who can be against us?" },
          { v: 32, t: "He who didn't spare his own Son, but delivered him up for us all, how would he not also with him freely give us all things?" },
          { v: 33, t: "Who could bring a charge against God's chosen ones? It is God who justifies." },
          { v: 34, t: "Who is he who condemns? It is Christ who died, yes rather, who was raised from the dead, who is at the right hand of God, who also makes intercession for us." },
          { v: 35, t: "Who shall separate us from the love of Christ? Could oppression, or anguish, or persecution, or famine, or nakedness, or peril, or sword?" },
          { v: 37, t: "No, in all these things, we are more than conquerors through him who loved us." },
          { v: 38, t: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers," },
          { v: 39, t: "nor height, nor depth, nor any other created thing, will be able to separate us from God's love, which is in Christ Jesus our Lord." }
        ]
      },
      {
        ref: "Ephesians 2:4-10",
        theme: "Saved by grace. Built for purpose.",
        prompt: "What 'good work' has God prepared for you this week?",
        verses: [
          { v: 4, t: "But God, being rich in mercy, for his great love with which he loved us," },
          { v: 5, t: "even when we were dead through our trespasses, made us alive together with Christ — by grace you have been saved —" },
          { v: 6, t: "and raised us up with him, and made us to sit with him in the heavenly places in Christ Jesus," },
          { v: 7, t: "that in the ages to come he might show the exceeding riches of his grace in kindness toward us in Christ Jesus;" },
          { v: 8, t: "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God," },
          { v: 9, t: "not of works, that no one would boast." },
          { v: 10, t: "For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them." }
        ]
      },
      {
        ref: "2 Corinthians 5:17-21",
        theme: "New creation.",
        prompt: "What old version of yourself do you need to bury today?",
        verses: [
          { v: 17, t: "Therefore if anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new." },
          { v: 18, t: "But all things are of God, who reconciled us to himself through Jesus Christ, and gave to us the ministry of reconciliation;" },
          { v: 19, t: "namely, that God was in Christ reconciling the world to himself, not reckoning to them their trespasses, and having committed to us the word of reconciliation." },
          { v: 20, t: "We are therefore ambassadors on behalf of Christ, as though God were entreating by us: we beg you on behalf of Christ, be reconciled to God." },
          { v: 21, t: "For him who knew no sin he made to be sin on our behalf; so that in him we might become the righteousness of God." }
        ]
      },
      {
        ref: "1 Peter 2:9-12",
        theme: "Chosen. Royal. Holy.",
        prompt: "How does being 'chosen' change how you walk into school/work tomorrow?",
        verses: [
          { v: 9, t: "But you are a chosen race, a royal priesthood, a holy nation, a people for God's own possession, that you may proclaim the excellence of him who called you out of darkness into his marvelous light." },
          { v: 10, t: "In the past, you were not a people, but now are God's people, who had not obtained mercy, but now have obtained mercy." },
          { v: 11, t: "Beloved, I beg you as foreigners and pilgrims, to abstain from fleshly lusts which war against the soul;" },
          { v: 12, t: "having good behavior among the nations, so in that of which they speak against you as evildoers, they may by your good works, which they see, glorify God in the day of visitation." }
        ]
      }
    ]
  },

  {
    id: "wisdom",
    name: "Wisdom for the Way",
    emoji: "🧠",
    color: "#a06bff",
    desc: "Proverbs that hit different. Daily wisdom drops.",
    lessons: [
      {
        ref: "Proverbs 1:7-10",
        theme: "Where wisdom starts.",
        prompt: "Whose voice are you actually listening to right now?",
        verses: [
          { v: 7, t: "The fear of Yahweh is the beginning of knowledge; but the foolish despise wisdom and instruction." },
          { v: 8, t: "My son, listen to your father's instruction, and don't forsake your mother's teaching:" },
          { v: 9, t: "for they will be a garland to grace your head, and chains around your neck." },
          { v: 10, t: "My son, if sinners entice you, don't consent." }
        ]
      },
      {
        ref: "Proverbs 3:5-12",
        theme: "Trust + lean in.",
        prompt: "Where are you leaning on your own understanding right now?",
        verses: [
          { v: 5, t: "Trust in Yahweh with all your heart, and don't lean on your own understanding." },
          { v: 6, t: "In all your ways acknowledge him, and he will make your paths straight." },
          { v: 7, t: "Don't be wise in your own eyes. Fear Yahweh, and depart from evil." },
          { v: 8, t: "It will be health to your body, and nourishment to your bones." },
          { v: 9, t: "Honor Yahweh with your substance, with the first fruits of all your increase:" },
          { v: 10, t: "so your barns will be filled with plenty, and your vats will overflow with new wine." },
          { v: 11, t: "My son, don't despise Yahweh's discipline, neither be weary of his correction:" },
          { v: 12, t: "for whom Yahweh loves, he corrects, even as a father reproves the son in whom he delights." }
        ]
      },
      {
        ref: "Proverbs 4:23-27",
        theme: "Guard your heart.",
        prompt: "What inputs (feeds, friends, habits) need a guard at the door?",
        verses: [
          { v: 23, t: "Keep your heart with all diligence, for out of it is the wellspring of life." },
          { v: 24, t: "Put away from yourself a perverse mouth. Put corrupt lips far from you." },
          { v: 25, t: "Let your eyes look straight ahead. Fix your gaze directly before you." },
          { v: 26, t: "Make the path of your feet level. Let all of your ways be established." },
          { v: 27, t: "Don't turn to the right hand nor to the left. Remove your foot from evil." }
        ]
      },
      {
        ref: "Proverbs 13:20",
        theme: "You become who you hang with.",
        prompt: "Name your top 5. Where are they leading you?",
        verses: [
          { v: 20, t: "One who walks with wise men grows wise, but a companion of fools suffers harm." }
        ]
      },
      {
        ref: "Proverbs 27:17",
        theme: "Iron sharpens iron.",
        prompt: "Who sharpens you? Who do you sharpen?",
        verses: [
          { v: 17, t: "Iron sharpens iron; so a man sharpens his friend's countenance." }
        ]
      }
    ]
  },

  {
    id: "mark",
    name: "The King's Story",
    emoji: "👑",
    color: "#3ddc84",
    desc: "Meet Jesus through the Gospel of Mark.",
    lessons: [
      {
        ref: "Mark 1:14-20",
        theme: "Follow me.",
        prompt: "What 'nets' is Jesus asking you to drop today?",
        verses: [
          { v: 14, t: "Now after John was taken into custody, Jesus came into Galilee, preaching the Good News of God's Kingdom," },
          { v: 15, t: "and saying, \"The time is fulfilled, and God's Kingdom is at hand! Repent, and believe in the Good News.\"" },
          { v: 16, t: "Passing along by the sea of Galilee, he saw Simon and Andrew the brother of Simon casting a net into the sea, for they were fishermen." },
          { v: 17, t: "Jesus said to them, \"Come after me, and I will make you into fishers for men.\"" },
          { v: 18, t: "Immediately they left their nets, and followed him." },
          { v: 19, t: "Going on a little further from there, he saw James the son of Zebedee, and John, his brother, who were also in the boat mending the nets." },
          { v: 20, t: "Immediately he called them, and they left their father, Zebedee, in the boat with the hired servants, and went after him." }
        ]
      },
      {
        ref: "Mark 4:35-41",
        theme: "Even the wind obeys him.",
        prompt: "What storm are you in? Wake him up — talk to him.",
        verses: [
          { v: 35, t: "On that day, when evening had come, he said to them, \"Let's go over to the other side.\"" },
          { v: 36, t: "Leaving the multitude, they took him with them, even as he was, in the boat. Other small boats were also with him." },
          { v: 37, t: "A big wind storm arose, and the waves beat into the boat, so much that the boat was already filled." },
          { v: 38, t: "He himself was in the stern, asleep on the cushion, and they woke him up, and told him, \"Teacher, don't you care that we are dying?\"" },
          { v: 39, t: "He awoke, and rebuked the wind, and said to the sea, \"Peace! Be still!\" The wind ceased, and there was a great calm." },
          { v: 40, t: "He said to them, \"Why are you so afraid? How is it that you have no faith?\"" },
          { v: 41, t: "They were greatly afraid, and said to one another, \"Who then is this, that even the wind and the sea obey him?\"" }
        ]
      },
      {
        ref: "Mark 8:34-38",
        theme: "Take up your cross.",
        prompt: "What does losing your life for Jesus look like for you this week?",
        verses: [
          { v: 34, t: "He called the multitude to himself with his disciples, and said to them, \"Whoever wants to come after me, let him deny himself, and take up his cross, and follow me.\"" },
          { v: 35, t: "\"For whoever wants to save his life will lose it; and whoever will lose his life for my sake and the sake of the Good News will save it.\"" },
          { v: 36, t: "\"For what does it profit a man, to gain the whole world, and forfeit his life?\"" },
          { v: 37, t: "\"For what will a man give in exchange for his life?\"" },
          { v: 38, t: "\"For whoever will be ashamed of me and of my words in this adulterous and sinful generation, the Son of Man also will be ashamed of him, when he comes in his Father's glory with the holy angels.\"" }
        ]
      },
      {
        ref: "Mark 10:17-22",
        theme: "What's in your hand?",
        prompt: "What's the one thing Jesus is asking you to release?",
        verses: [
          { v: 17, t: "As he was going out into the way, one ran to him, knelt before him, and asked him, \"Good Teacher, what shall I do that I may inherit eternal life?\"" },
          { v: 18, t: "Jesus said to him, \"Why do you call me good? No one is good except one — God.\"" },
          { v: 19, t: "\"You know the commandments: 'Do not murder,' 'Do not commit adultery,' 'Do not steal,' 'Do not give false testimony,' 'Do not defraud,' 'Honor your father and mother.'\"" },
          { v: 20, t: "He said to him, \"Teacher, I have observed all these things from my youth.\"" },
          { v: 21, t: "Jesus looking at him loved him, and said to him, \"One thing you lack. Go, sell whatever you have, and give to the poor, and you will have treasure in heaven; and come, follow me, taking up the cross.\"" },
          { v: 22, t: "But his face fell at that saying, and he went away sorrowful, for he was one who had great possessions." }
        ]
      },
      {
        ref: "Mark 15:33-39",
        theme: "It is finished.",
        prompt: "Sit with the cross. Then thank him out loud.",
        verses: [
          { v: 33, t: "When the sixth hour had come, there was darkness over the whole land until the ninth hour." },
          { v: 34, t: "At the ninth hour Jesus cried with a loud voice, saying, \"Eloi, Eloi, lama sabachthani?\" which is, being interpreted, \"My God, my God, why have you forsaken me?\"" },
          { v: 35, t: "Some of those who stood by, when they heard it, said, \"Behold, he is calling Elijah.\"" },
          { v: 37, t: "Jesus cried out with a loud voice, and gave up the spirit." },
          { v: 38, t: "The veil of the temple was torn in two from the top to the bottom." },
          { v: 39, t: "When the centurion, who stood by opposite him, saw that he cried out like this and breathed his last, he said, \"Truly this man was the Son of God!\"" }
        ]
      },
      {
        ref: "Mark 16:1-7",
        theme: "He is risen.",
        prompt: "Where do you need resurrection power right now?",
        verses: [
          { v: 1, t: "When the Sabbath was past, Mary Magdalene, and Mary the mother of James, and Salome, bought spices, that they might come and anoint him." },
          { v: 2, t: "Very early on the first day of the week, they came to the tomb when the sun had risen." },
          { v: 3, t: "They were saying among themselves, \"Who will roll away the stone from the door of the tomb for us?\"" },
          { v: 4, t: "for it was very big. Looking up, they saw that the stone was rolled back." },
          { v: 5, t: "Entering into the tomb, they saw a young man sitting on the right side, dressed in a white robe, and they were amazed." },
          { v: 6, t: "He said to them, \"Don't be amazed. You seek Jesus, the Nazarene, who has been crucified. He has risen. He is not here. Behold, the place where they laid him!\"" },
          { v: 7, t: "\"But go, tell his disciples and Peter, 'He goes before you into Galilee. There you will see him, as he said to you.'\"" }
        ]
      }
    ]
  },

  {
    id: "endure",
    name: "Run Your Race",
    emoji: "🏃",
    color: "#ffd166",
    desc: "Endurance, discipline, finishing strong.",
    lessons: [
      {
        ref: "Hebrews 12:1-3",
        theme: "Run with endurance.",
        prompt: "What weight do you need to throw off to run faster?",
        verses: [
          { v: 1, t: "Therefore let us also, seeing we are surrounded by so great a cloud of witnesses, lay aside every weight and the sin which so easily entangles us, and let us run with perseverance the race that is set before us," },
          { v: 2, t: "looking to Jesus, the author and perfecter of faith, who for the joy that was set before him endured the cross, despising its shame, and has sat down at the right hand of the throne of God." },
          { v: 3, t: "For consider him who has endured such contradiction of sinners against himself, that you don't grow weary, fainting in your souls." }
        ]
      },
      {
        ref: "1 Corinthians 9:24-27",
        theme: "Train like you mean it.",
        prompt: "Where are you 'beating the air'? What needs real discipline?",
        verses: [
          { v: 24, t: "Don't you know that those who run in a race all run, but one receives the prize? Run like that, that you may win." },
          { v: 25, t: "Every man who strives in the games exercises self-control in all things. Now they do it to receive a corruptible crown, but we an incorruptible." },
          { v: 26, t: "I therefore run like that, not aimlessly. I fight like that, not beating the air," },
          { v: 27, t: "but I beat my body and bring it into submission, lest by any means, after I have preached to others, I myself should be rejected." }
        ]
      },
      {
        ref: "James 1:2-8",
        theme: "Trials build you.",
        prompt: "Where is God using a trial to grow you right now?",
        verses: [
          { v: 2, t: "Count it all joy, my brothers, when you fall into various temptations," },
          { v: 3, t: "knowing that the testing of your faith produces endurance." },
          { v: 4, t: "Let endurance have its perfect work, that you may be perfect and complete, lacking in nothing." },
          { v: 5, t: "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him." },
          { v: 6, t: "But let him ask in faith, without any doubting, for he who doubts is like a wave of the sea, driven by the wind and tossed." },
          { v: 7, t: "For let that man not think that he will receive anything from the Lord." },
          { v: 8, t: "He is a double-minded man, unstable in all his ways." }
        ]
      },
      {
        ref: "Philippians 3:12-14",
        theme: "Press on.",
        prompt: "What do you need to forget? What's God calling you forward to?",
        verses: [
          { v: 12, t: "Not that I have already obtained, or am already made perfect; but I press on, that I may take hold of that for which also I was taken hold of by Christ Jesus." },
          { v: 13, t: "Brothers, I don't regard myself as yet having taken hold, but one thing I do: forgetting the things which are behind, and stretching forward to the things which are before," },
          { v: 14, t: "I press on toward the goal for the prize of the high calling of God in Christ Jesus." }
        ]
      },
      {
        ref: "2 Timothy 4:6-8",
        theme: "I have finished the race.",
        prompt: "If today were your last lap, what would you change?",
        verses: [
          { v: 6, t: "For I am already being offered, and the time of my departure has come." },
          { v: 7, t: "I have fought the good fight. I have finished the course. I have kept the faith." },
          { v: 8, t: "From now on, the crown of righteousness is stored up for me, which the Lord, the righteous judge, will give to me on that day; and not to me only, but also to all those who have loved his appearing." }
        ]
      }
    ]
  }
];

const AVATARS = [
  "🦁", // lion
  "🐺", // wolf
  "🦅", // eagle
  "🐉", // dragon
  "⚔️",  // sword
  "🛡️", // shield
  "⚡",        // bolt
  "🔥",  // fire
  "🏄",  // surfer
  "🏀",  // ball
  "🎮",  // game
  "🎯"   // target
];

const ACHIEVEMENTS = [
  { id: "first_step",    name: "First Step",      emoji: "👣", desc: "Read your first passage.",        check: s => s.totalChapters >= 1 },
  { id: "week_streak",   name: "On Fire",         emoji: "🔥", desc: "7-day streak.",                   check: s => s.bestStreak >= 7 },
  { id: "month_streak",  name: "Iron Man",        emoji: "🤖", desc: "30-day streak.",                  check: s => s.bestStreak >= 30 },
  { id: "ten_chapters",  name: "Bookworm",        emoji: "📚", desc: "Read 10 passages.",               check: s => s.totalChapters >= 10 },
  { id: "fifty",         name: "Disciple",        emoji: "👑", desc: "Read 50 passages.",               check: s => s.totalChapters >= 50 },
  { id: "reflect_5",     name: "Deep Thinker",    emoji: "🧠", desc: "Save 5 reflections.",             check: s => (s.reflections || 0) >= 5 },
  { id: "thousand_xp",   name: "Grinder",         emoji: "⚡",        desc: "Earn 1,000 XP.",                  check: s => s.xp >= 1000 },
  { id: "all_plans",     name: "Well-Rounded",    emoji: "🏆", desc: "Read from every plan.",           check: s => Object.keys(s.planProgress || {}).length >= PLANS.length },
  { id: "early_bird",    name: "Early Bird",      emoji: "🌅", desc: "Read before 8am.",                check: s => s.flags && s.flags.earlyBird }
];

const RANKS = [
  { lv: 1,  xp: 0,    name: "Squire" },
  { lv: 2,  xp: 100,  name: "Page" },
  { lv: 3,  xp: 250,  name: "Soldier" },
  { lv: 4,  xp: 500,  name: "Knight" },
  { lv: 5,  xp: 900,  name: "Captain" },
  { lv: 6,  xp: 1400, name: "Champion" },
  { lv: 7,  xp: 2000, name: "Warrior" },
  { lv: 8,  xp: 2800, name: "Lionheart" },
  { lv: 9,  xp: 3800, name: "Disciple" },
  { lv: 10, xp: 5000, name: "Apostle" }
];

const LEAGUES = [
  { name: "Bronze League",   minXp: 0,    color: "#cd7f32" },
  { name: "Silver League",   minXp: 300,  color: "#c0c0c0" },
  { name: "Gold League",     minXp: 800,  color: "#ffd166" },
  { name: "Sapphire League", minXp: 1500, color: "#4cc9ff" },
  { name: "Ruby League",     minXp: 2500, color: "#ff4f6d" },
  { name: "Diamond League",  minXp: 4000, color: "#a06bff" }
];

const FRIEND_POOL = [
  { name: "Caleb",   avatar: "🦁" },
  { name: "Jude",    avatar: "🐺" },
  { name: "Eli",     avatar: "🦅" },
  { name: "Micah",   avatar: "⚔️" },
  { name: "Asher",   avatar: "⚡" },
  { name: "Levi",    avatar: "🔥" },
  { name: "Silas",   avatar: "🐉" },
  { name: "Josiah",  avatar: "🛡️" },
  { name: "Tobias",  avatar: "🎯" },
  { name: "Jonah",   avatar: "🏄" }
];
