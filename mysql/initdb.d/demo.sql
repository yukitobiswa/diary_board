-- MySQL dump 10.13  Distrib 8.0.41, for Linux (aarch64)
--
-- Host: localhost    Database: demo
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer` (
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quiz_id` int NOT NULL,
  `diary_id` int NOT NULL,
  `language_id` int NOT NULL,
  `answer_date` datetime NOT NULL,
  `choices` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judgement` int NOT NULL,
  PRIMARY KEY (`team_id`,`user_id`,`quiz_id`,`diary_id`),
  KEY `quiz_id` (`quiz_id`,`diary_id`),
  KEY `language_id` (`language_id`),
  CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`quiz_id`, `diary_id`) REFERENCES `quiz` (`quiz_id`, `diary_id`),
  CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer`
--

LOCK TABLES `answer` WRITE;
/*!40000 ALTER TABLE `answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `answer_set`
--

DROP TABLE IF EXISTS `answer_set`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer_set` (
  `set_id` int NOT NULL AUTO_INCREMENT,
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diary_id` int NOT NULL,
  `answer_time` datetime NOT NULL,
  `correct_set` int NOT NULL,
  PRIMARY KEY (`set_id`),
  KEY `user_id` (`user_id`,`team_id`),
  KEY `diary_id` (`diary_id`),
  CONSTRAINT `answer_set_ibfk_1` FOREIGN KEY (`user_id`, `team_id`) REFERENCES `user` (`user_id`, `team_id`),
  CONSTRAINT `answer_set_ibfk_2` FOREIGN KEY (`diary_id`) REFERENCES `diary` (`diary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer_set`
--

LOCK TABLES `answer_set` WRITE;
/*!40000 ALTER TABLE `answer_set` DISABLE KEYS */;
/*!40000 ALTER TABLE `answer_set` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_quiz`
--

DROP TABLE IF EXISTS `cash_quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_quiz` (
  `cash_quiz_id` int NOT NULL,
  `diary_id` int NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `a` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `b` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `c` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `d` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`cash_quiz_id`,`diary_id`),
  KEY `user_id` (`user_id`,`team_id`),
  CONSTRAINT `cash_quiz_ibfk_1` FOREIGN KEY (`user_id`, `team_id`) REFERENCES `user` (`user_id`, `team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_quiz`
--

LOCK TABLES `cash_quiz` WRITE;
/*!40000 ALTER TABLE `cash_quiz` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diary`
--

DROP TABLE IF EXISTS `diary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diary` (
  `diary_id` int NOT NULL AUTO_INCREMENT,
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diary_time` datetime NOT NULL,
  `main_language` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbs_up` int DEFAULT '0',
  `love` int DEFAULT '0',
  `laugh` int DEFAULT '0',
  `surprised` int DEFAULT '0',
  `sad` int DEFAULT '0',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`diary_id`),
  KEY `user_id` (`user_id`,`team_id`),
  KEY `main_language` (`main_language`),
  CONSTRAINT `diary_ibfk_1` FOREIGN KEY (`user_id`, `team_id`) REFERENCES `user` (`user_id`, `team_id`),
  CONSTRAINT `diary_ibfk_2` FOREIGN KEY (`main_language`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diary`
--

LOCK TABLES `diary` WRITE;
/*!40000 ALTER TABLE `diary` DISABLE KEYS */;
INSERT INTO `diary` VALUES (1,'sia','01','お正月の日','2025-02-15 20:07:53',1,'お正月におばあちゃんの家へ行った。朝、お母さんと一緒におせち料理をお皿に並べた。黒豆やかまぼこ、だてまきがきれいに並んでいて、おばあちゃんが「黒豆はまめに働くように、だてまきは勉強ができるようにって意味があるのよ」と教えてくれた。\n\nお昼には、みんなでお雑煮を食べた。お餅がやわらかくておいしかったけれど、のどに詰まらないように気をつけながら食べた。食べ終わると、おじいちゃんが「そろそろお年玉の時間かな？」と言って、ぼくたちは大喜び！\n\n午後は、いとこたちと外で羽根つきをした。何回も負けて、ほっぺたに墨をぬられたけれど、とても楽しかった。今年も元気に過ごせますように！',0,0,0,0,0,1);
/*!40000 ALTER TABLE `diary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language`
--

DROP TABLE IF EXISTS `language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language` (
  `language_id` int NOT NULL AUTO_INCREMENT,
  `language_name` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`language_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language`
--

LOCK TABLES `language` WRITE;
/*!40000 ALTER TABLE `language` DISABLE KEYS */;
INSERT INTO `language` VALUES (1,'日本語'),(2,'英語'),(3,'ポルトガル語'),(4,'スペイン語'),(5,'中国語（簡）'),(6,'中国語（繁）'),(7,'韓国語'),(8,'タガログ語'),(9,'ベトナム語'),(10,'インドネシア語'),(11,'ネパール語');
/*!40000 ALTER TABLE `language` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `multilingual_diary`
--

DROP TABLE IF EXISTS `multilingual_diary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `multilingual_diary` (
  `diary_id` int NOT NULL AUTO_INCREMENT,
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language_id` int NOT NULL,
  `title` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diary_time` datetime NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`diary_id`,`language_id`),
  KEY `user_id` (`user_id`,`team_id`),
  KEY `language_id` (`language_id`),
  CONSTRAINT `multilingual_diary_ibfk_1` FOREIGN KEY (`user_id`, `team_id`) REFERENCES `user` (`user_id`, `team_id`),
  CONSTRAINT `multilingual_diary_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `multilingual_diary`
--

LOCK TABLES `multilingual_diary` WRITE;
/*!40000 ALTER TABLE `multilingual_diary` DISABLE KEYS */;
INSERT INTO `multilingual_diary` VALUES (1,'sia','01',1,'お正月の日','2025-02-15 20:07:53','お正月におばあちゃんの家へ行った。朝、お母さんと一緒におせち料理をお皿に並べた。黒豆やかまぼこ、だてまきがきれいに並んでいて、おばあちゃんが「黒豆はまめに働くように、だてまきは勉強ができるようにって意味があるのよ」と教えてくれた。\n\nお昼には、みんなでお雑煮を食べた。お餅がやわらかくておいしかったけれど、のどに詰まらないように気をつけながら食べた。食べ終わると、おじいちゃんが「そろそろお年玉の時間かな？」と言って、ぼくたちは大喜び！\n\n午後は、いとこたちと外で羽根つきをした。何回も負けて、ほっぺたに墨をぬられたけれど、とても楽しかった。今年も元気に過ごせますように！',1),(1,'sia','01',2,'New Year\'s Day','2025-02-15 20:07:53','I went to my grandma\'s house on New Year\'s Day. In the morning, my mother and I arranged the New Year\'s food on a plate. Black beans, kamaboko, and datemaki were lined up neatly, and my grandma told me, \"Black beans mean to work hard, and datemaki means to study well.\" At lunch, we all ate zoni. The mochi was soft and delicious, but we had to be careful not to choke on it. When we finished eating, my grandpa said, \"Is it time for the New Year\'s money?\" and we were so happy! In the afternoon, we played shuttlecock with our cousins outside. We lost many times and got ink on our cheeks, but it was a lot of fun. I hope we can spend this year in good health!',1),(1,'sia','01',3,'Dia de Ano Novo','2025-02-15 20:07:53','Fui para a casa da minha avó no Ano Novo. De manhã, minha mãe e eu arrumamos os pratos do Ano Novo. Feijão preto, kamaboko e datemaki estavam cuidadosamente alinhados, e a avó me disse: \"O feijão preto é para trabalhar duro, e o datemaki é para estudar bem.\" No almoço, todos nós comemos zoni. O bolo de arroz era macio e delicioso, mas tive que tomar cuidado ao comê-lo para não engasgar. Quando terminamos de comer, o avô disse: \"Já está quase na hora do dinheiro do Ano Novo?\" e ficamos tão felizes! À tarde, joguei peteca lá fora com meus primos. Perdi muitas vezes e fiquei com tinta nas bochechas, mas foi muito divertido. Espero que você tenha um ano saudável!',1),(1,'sia','01',4,'Día de Año Nuevo','2025-02-15 20:07:53','Fui a la casa de mi abuela para Año Nuevo. Por la mañana, mi madre y yo dispusimos los platos de Año Nuevo en platos. Los frijoles negros, el kamaboko y el datemaki estaban perfectamente alineados, y la abuela me dijo: \"Los frijoles negros son para trabajar duro y los datemaki son para estudiar bien\". Para el almuerzo, todos comimos zoni. El pastel de arroz era suave y delicioso, pero tuve que tener cuidado al comerlo para no atragantarme. Cuando terminamos de comer, el abuelo dijo: \"¿Ya casi es la hora del dinero de Año Nuevo?\" ¡Y estábamos muy felices! Por la tarde, jugué al volante al aire libre con mis primos. Perdí muchas veces y me manché las mejillas con tinta, pero fue muy divertido. ¡Deseo que tengas un año saludable!',1),(1,'sia','01',5,'元旦','2025-02-15 20:07:53','我去奶奶家过年。早上，我和妈妈把年菜摆放到盘子里。黑豆、鱼糕、枣卷整齐地排列着，奶奶告诉我“黑豆是用来努力工作的，枣卷是用来好好学习的”。 午餐时，我们一起吃了 zoni。年糕松软可口，不过吃的时候必须小心，以免噎住。吃完饭，爷爷说：“快到压岁钱了吗？”我们高兴极了！ 下午，我和表兄弟们在外面打毽子。我输了很多次，脸颊上还沾满了墨水，但这很有趣。祝您新年身体健康！',1),(1,'sia','01',6,'元旦','2025-02-15 20:07:53','我去奶奶家過年。早上，我和媽媽把年菜擺放到盤子裡。黑豆、魚糕、椰棗整齊地排列著，奶奶告訴我「黑豆是用來努力工作的，棗卷是用來好好學習的」。 午餐時，我們一起吃了 zoni。年糕鬆軟可口，但吃的時候必須小心，以免噎住。吃完飯，爺爺說：「快到壓歲錢了嗎？」我們高興極了！ 下午，我和表兄弟們在外面打毽子。我輸了很多次，臉頰上還沾滿了墨水，但這很有趣。祝您新年身體健康！',1),(1,'sia','01',7,'새해의 날','2025-02-15 20:07:53','설날에 할머니의 집에 갔다. 아침, 엄마와 함께 오세치 요리를 접시에 늘어놓았다. 흑콩이나 가마보코, 다테마키가 예쁘게 늘어서 있고, 할머니가 「흑콩은 물집에 일하도록, 다테마키는 공부를 할 수 있게 되어 의미가 있어」라고 가르쳐 주었다. 점심에는 모두 볶음을 먹었다. 떡이 부드럽고 맛있었지만 목구멍에 막히지 않도록 조심하면서 먹었다. 먹고 끝나면, 할아버지가 「슬슬 낡은 시간일까?」라고 말해, 우리들은 큰 기쁨! 오후는 사촌들과 밖에서 날개 달렸다. 몇 번이나 지고, 뺨에 먹을 젖었지만, 매우 즐거웠다. 올해도 잘 지낼 수 있도록!',1),(1,'sia','01',8,'Araw ng Bagong Taon','2025-02-15 20:07:53','Pumunta ako sa bahay ng aking lola para sa Bagong Taon. Sa umaga, inayos namin ng aking ina ang mga pinggan para sa Bagong Taon sa mga plato. Ang mga black beans, kamaboko, at datemaki ay maayos na nakahanay, at sinabi sa akin ni lola, \"Ang black beans ay para sa pagsusumikap, at ang datemaki ay para sa pag-aaral ng mabuti.\" Para sa tanghalian, kumain kaming lahat ng zoni. Malambot at masarap ang rice cake, pero kailangan kong mag-ingat sa pagkain para hindi mabulunan. Nang matapos kaming kumain, sinabi ni lolo, \"Malapit na ba ang pera ng Bagong Taon at sobrang saya namin?\" Sa hapon, naglaro ako ng shuttlecock sa labas kasama ng mga pinsan ko. Maraming beses akong natalo at may tinta sa aking pisngi, ngunit ito ay napakasaya. Umaasa ako na mayroon kang isang malusog na taon!',1),(1,'sia','01',9,'Ngày đầu năm mới','2025-02-15 20:07:53','Tôi đã đến nhà bà ngoại để đón năm mới. Buổi sáng, mẹ tôi và tôi sắp xếp các món ăn mừng năm mới vào đĩa. Đậu đen, kamaboko và datemaki được xếp ngay ngắn, và bà nói với tôi, \"Đậu đen dùng để làm việc chăm chỉ, còn datemaki dùng để học tập tốt.\" Vào bữa trưa, tất cả chúng tôi đều ăn zoni. Bánh gạo mềm và ngon, nhưng tôi phải cẩn thận khi ăn để không bị nghẹn. Khi chúng tôi ăn xong, ông nội hỏi: \"Sắp đến ngày lĩnh tiền mừng năm mới rồi phải không?\" và chúng tôi rất vui! Buổi chiều, tôi chơi cầu lông ngoài trời với anh chị em họ của tôi. Tôi đã thua nhiều lần và bị dính mực vào má, nhưng điều đó thực sự rất vui. Tôi hy vọng bạn có một năm khỏe mạnh!',1),(1,'sia','01',10,'Hari Tahun Baru','2025-02-15 20:07:53','Saya pergi ke rumah nenek saya untuk Tahun Baru. Di pagi hari, ibu dan aku menata hidangan Tahun Baru di piring. Kacang hitam, kamaboko, dan datemaki tersusun rapi, dan nenek berkata padaku, \"Kacang hitam untuk bekerja keras, dan datemaki untuk belajar dengan baik.\" Untuk makan siang, kami semua makan zoni. Kue berasnya lembut dan lezat, tetapi saya harus berhati-hati saat memakannya agar tidak tersedak. Ketika kami selesai makan, kakek berkata, \"Apakah sudah hampir waktunya untuk uang Tahun Baru?\" dan kami sangat gembira! Sore harinya, aku bermain shuttlecock di luar bersama sepupuku. Aku kalah berkali-kali dan pipiku bertinta, tetapi itu sangat menyenangkan. Saya harap Anda memiliki tahun yang sehat!',1),(1,'sia','01',11,'नयाँ वर्षको दिन','2025-02-15 20:07:53','म नयाँ वर्षको लागि हजुरआमाको घरमा गएको थिएँ। बिहान, मेरी आमा र मैले प्लेटहरूमा नयाँ वर्षको परिकार मिलायौं। कालो सिमी, कामाबोको र दालमाकी सफासँग लाइनमा राखिएको थियो, र हजुरआमाले मलाई भन्नुभयो, \"कालो सिमी कडा परिश्रम गर्नको लागि हो, र दालमाकी राम्रोसँग पढ्नको लागि हो।\" दिउँसोको खानामा, हामी सबैले जोनी खायौं। भातको केक नरम र स्वादिष्ट थियो, तर खाँदा मलाई होसियार हुनुपर्थ्यो ताकि यसमा निसास्सिएर नजाओस्। हामीले खाना खाइसकेपछि हजुरबुबाले भन्नुभयो, \"के नयाँ वर्षको पैसा जम्मा गर्ने समय भयो?\" अनि हामी धेरै खुसी भयौं! दिउँसो, म मेरा काकाका भाइबहिनीहरूसँग बाहिर शटलकक खेल्थें। म धेरै पटक हारेँ र मेरो गालामा मसी लाग्यो, तर यो धेरै रमाइलो थियो। मलाई आशा छ तपाईंको वर्ष स्वस्थ रहोस्!',1);
/*!40000 ALTER TABLE `multilingual_diary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `multilingual_quiz`
--

DROP TABLE IF EXISTS `multilingual_quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `multilingual_quiz` (
  `quiz_id` int NOT NULL,
  `diary_id` int NOT NULL,
  `language_id` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `a` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `b` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `c` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `d` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`quiz_id`,`diary_id`,`language_id`),
  KEY `language_id` (`language_id`),
  KEY `diary_id` (`diary_id`),
  CONSTRAINT `multilingual_quiz_ibfk_1` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`),
  CONSTRAINT `multilingual_quiz_ibfk_2` FOREIGN KEY (`diary_id`) REFERENCES `diary` (`diary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `multilingual_quiz`
--

LOCK TABLES `multilingual_quiz` WRITE;
/*!40000 ALTER TABLE `multilingual_quiz` DISABLE KEYS */;
INSERT INTO `multilingual_quiz` VALUES (1,1,1,'おせちりょうりにふくまれる黒豆の意味は何ですか？','3','ほうさくをねがう','けんこうをねがう','まめにはたらくこと','勉強ができること'),(1,1,2,'What is the significance of black beans in New Year\'s cuisine?','3','Praying for a good harvest','Wishing you good health','Working hard','What you can study'),(1,1,3,'Qual é o significado do feijão preto na culinária de Ano Novo?','3','Rezando por uma boa colheita','Desejando-lhe boa saúde','Trabalhando duro','O que você pode estudar'),(1,1,4,'¿Cuál es el significado de los frijoles negros en la cocina de Año Nuevo?','3','Orando por una buena cosecha','Te deseo buena salud','Trabajando duro','Qué puedes estudiar'),(1,1,5,'黑豆在新年菜肴中有何意义？','3','祈求丰收','祝你身体健康','努力工作','你可以学习什么'),(1,1,6,'黑豆在新年菜餚中有何意義？','3','祈求豐收','祝你身體健康','努力工作','你可以學習什麼'),(1,1,7,'오세치 요리에 포함 된 검은 콩의 의미는 무엇입니까?','3','풍작을 바란다','건강을 원한다','물집에서 일','공부할 수 있는 일'),(1,1,8,'Ano ang kahalagahan ng black beans sa lutuing Bagong Taon?','3','Nagdarasal para sa magandang ani','Nais kang mabuting kalusugan','Nagsusumikap','Kung ano ang maaari mong pag-aralan'),(1,1,9,'Đậu đen có ý nghĩa gì trong ẩm thực ngày Tết?','3','Cầu nguyện cho một vụ mùa bội thu','Chúc bạn sức khỏe tốt','Làm việc chăm chỉ','Những gì bạn có thể học'),(1,1,10,'Apa pentingnya kacang hitam dalam masakan Tahun Baru?','3','Berdoa untuk panen yang baik','Semoga Anda selalu sehat','Bekerja keras','Apa yang dapat Anda pelajari'),(1,1,11,'नयाँ वर्षको खानामा कालो सिमीको के महत्व छ?','3','राम्रो फसलको लागि प्रार्थना गर्दै','स्वास्थ्य को कामना','कडा परिश्रम गर्दै','तपाईंले के अध्ययन गर्न सक्नुहुन्छ'),(2,1,1,'おじいちゃんが言った「お年玉」は何ですか？','2','新年のあいさつ','こどもにわたすお金','食事のこと','おいわいの歌'),(2,1,2,'What is this \"New Year\'s gift\" that my grandpa mentioned?','2','New Year\'s Greetings','Money given to children','Food','Celebration song'),(2,1,3,'O que é esse \"presente de Ano Novo\" que meu avô mencionou?','2','Saudações de Ano Novo','Dinheiro dado às crianças','Comida','canção de celebração'),(2,1,4,'¿Qué es este “regalo de Año Nuevo” del que habló mi abuelo?','2','Saludos de año nuevo','Dinero donado a los niños','Alimento','canción de celebración'),(2,1,5,'我爷爷说的这个“新年礼物”到底是什么呢？','2','新年祝福','给孩子的钱','食物','庆祝歌曲'),(2,1,6,'我爺爺說的這個「新年禮物」到底是什麼呢？','2','新年祝福','給孩子的錢','食物','慶祝歌曲'),(2,1,7,'할아버지가 말한 \"오이타마\"는 무엇입니까?','2','새해 인사','아이에게 건네주는 돈','식사','축하의 노래'),(2,1,8,'Ano itong \"regalo ng Bagong Taon\" na binanggit ng aking lolo?','2','Pagbati ng Bagong Taon','Pera na binigay sa mga bata','Pagkain','awit ng pagdiriwang'),(2,1,9,'\"Món quà năm mới\" mà ông tôi nhắc đến là gì?','2','Lời chúc mừng năm mới','Tiền được trao cho trẻ em','Đồ ăn','bài hát ăn mừng'),(2,1,10,'Apa \"hadiah Tahun Baru\" yang disebutkan kakekku ini?','2','Ucapan Selamat Tahun Baru','Uang yang diberikan kepada anak-anak','Makanan','lagu perayaan'),(2,1,11,'मेरो हजुरबुबाले उल्लेख गर्नुभएको यो \"नयाँ वर्षको उपहार\" के हो?','2','नयाँ वर्षको शुभकामना','बालबालिकालाई दिइएको पैसा','खाना','उत्सव गीत'),(3,1,1,'「まめにはたらく」の「まめ」とはどういう意味ですか？','3','豆とはかんけいない','少しだけはたらく','きんべんであること','遊ぶこと'),(3,1,2,'What does \"mame\" in \"work diligently\" mean?','3','It has nothing to do with beans','Work a little','Being diligent','Play'),(3,1,3,'O que significa \"mame\" em \"trabalhar diligentemente\"?','3','Não tem nada a ver com feijão','Trabalhe um pouco','Ser diligente','jogar'),(3,1,4,'¿Qué significa \"mame\" en \"trabajar diligentemente\"?','3','No tiene nada que ver con los frijoles','Trabaja un poco','Ser diligente','jugar'),(3,1,5,'“勤奋工作”中的“mame”是什么意思？','3','这与豆类无关','稍微工作一下','勤奋','玩'),(3,1,6,'「勤奮工作」中的「mame」是什麼意思？','3','這與豆類無關','稍微工作一下','勤奮','玩'),(3,1,7,'\"마메에 일한다\"의 \"마메\"는 무슨 뜻입니까?','3','콩과는 무관하다','조금만 일하다','근면한 것','놀다'),(3,1,8,'Ano ang ibig sabihin ng \"mame\" sa \"work diligently\"?','3','Wala itong kinalaman sa beans','Magtrabaho ng kaunti','Ang pagiging masipag','maglaro'),(3,1,9,'\"Mame\" trong \"work carefully\" có nghĩa là gì?','3','Nó không liên quan gì đến đậu','Làm việc một chút','Sự siêng năng','chơi'),(3,1,10,'Apa arti \"mame\" dalam \"bekerja dengan tekun\"?','3','Itu tidak ada hubungannya dengan kacang','Bekerja sedikit','Menjadi tekun','untuk bermain'),(3,1,11,'\"लगनशील भएर काम गर्नु\" मा \"आमा\" को अर्थ के हो?','3','यसको सिमीसँग कुनै सम्बन्ध छैन।','थोरै काम गर।','मेहनती हुनु','खेल्न'),(4,1,1,'おせちりょうりに使われるかまぼこの主なざいりょうは何ですか？','2','米','魚','やさい','肉'),(4,1,2,'What is the main ingredient in kamaboko used in osechi cuisine?','2','Rice','fish','vegetables','meat'),(4,1,3,'Qual é o ingrediente principal do kamaboko usado na culinária osechi?','2','Arroz','peixe','vegetais','carne'),(4,1,4,'¿Cuál es el ingrediente principal del kamaboko utilizado en la cocina osechi?','2','Arroz','pez','verduras','carne'),(4,1,5,'御节料理中使用的鱼糕的主要原料是什么？','2','米','鱼','蔬菜','肉'),(4,1,6,'禦節料理中使用的魚糕的主要原料是什麼？','2','米','魚','蔬菜','肉'),(4,1,7,'오세치 요리에 사용되는 어묵의 주요 재료는 무엇입니까?','2','쌀','물고기','야채','고기'),(4,1,8,'Ano ang pangunahing sangkap sa kamaboko na ginagamit sa lutuing osechi?','2','kanin','isda','mga gulay','karne'),(4,1,9,'Thành phần chính của món kamaboko dùng trong ẩm thực osechi là gì?','2','Cơm','cá','rau','thịt'),(4,1,10,'Apa bahan utama kamaboko yang digunakan dalam masakan osechi?','2','Beras','ikan','sayuran','daging'),(4,1,11,'ओसेची खानामा प्रयोग हुने कामाबोकोको मुख्य सामग्री के हो?','2','चामल','माछा','तरकारी','मासु'),(5,1,1,'お正月の時期に家族が集まることは、どの文化にもよく見られますか？','1','はい','いいえ','時々','ほとんどない'),(5,1,2,'Is it common in all cultures for families to gather around New Year\'s?','1','yes','no','sometimes','Almost none'),(5,1,3,'É comum em todas as culturas as famílias se reunirem no Ano Novo?','1','sim','não','às vezes','Quase nenhum'),(5,1,4,'¿Es común en todas las culturas que las familias se reúnan alrededor del Año Nuevo?','1','Sí','No','a veces','Casi ninguno'),(5,1,5,'在所有文化中，新年期间家人团聚是一种常见的事吗？','1','是的','不','有时','几乎没有'),(5,1,6,'在所有文化中，新年期間家人團聚是常見的事嗎？','1','是的','不','有時','幾乎沒有'),(5,1,7,'설날에 가족이 모이는 것은 어떤 문화에서도 잘 볼 수 있습니까?','1','예','아니오','때때로','거의 없다'),(5,1,8,'Karaniwan ba sa lahat ng kultura ang pagtitipon ng mga pamilya sa Bagong Taon?','1','oo','hindi','minsan','Halos wala'),(5,1,9,'Có phải mọi nền văn hóa đều có thói quen tụ họp gia đình vào dịp năm mới không?','1','Đúng','KHÔNG','Thỉnh thoảng','Hầu như không có'),(5,1,10,'Apakah di semua budaya merupakan hal yang umum bagi keluarga untuk berkumpul saat Tahun Baru?','1','Ya','TIDAK','Kadang-kadang','Hampir tidak ada'),(5,1,11,'के सबै संस्कृतिहरूमा परिवारहरू नयाँ वर्षको वरिपरि भेला हुनु सामान्य छ?','1','हो','होइन','कहिलेकाहीं','लगभग कुनै पनि छैन');
/*!40000 ALTER TABLE `multilingual_quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz`
--

DROP TABLE IF EXISTS `quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz` (
  `quiz_id` int NOT NULL,
  `diary_id` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `a` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `b` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `c` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `d` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`quiz_id`,`diary_id`),
  KEY `diary_id` (`diary_id`),
  CONSTRAINT `quiz_ibfk_1` FOREIGN KEY (`diary_id`) REFERENCES `diary` (`diary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz`
--

LOCK TABLES `quiz` WRITE;
/*!40000 ALTER TABLE `quiz` DISABLE KEYS */;
INSERT INTO `quiz` VALUES (1,1,'おせち料理に含まれる黒豆の意味は何ですか？','3','豊作を願う','健康を願う','まめに働くこと','勉強ができること'),(2,1,'おじいちゃんが言った「お年玉」は何ですか？','2','新年の挨拶','子供に渡すお金','食事のこと','お祝いの歌'),(3,1,'「まめに働く」の「まめ」とはどういう意味ですか？','3','豆とは関係ない','少しだけ働く','勤勉であること','遊ぶこと'),(4,1,'おせち料理に使われるかまぼこの主な材料は何ですか？','2','米','魚','野菜','肉'),(5,1,'お正月の時期に家族が集まることは、どの文化にもよく見られますか？','1','はい','いいえ','時々','ほとんどない');
/*!40000 ALTER TABLE `quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_time` datetime NOT NULL,
  `country` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_count` int DEFAULT NULL,
  PRIMARY KEY (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES ('sia','SIA小学校 4年A組','2025-02-15 20:01:26','Japan,Brazil,Indonesia','Elementary4',30),('silab','社会知能研究室','2025-02-17 16:23:28','Japan,Philippines,Brazil','Elementary3',26);
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `title`
--

DROP TABLE IF EXISTS `title`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `title` (
  `title_id` int NOT NULL,
  `language_id` int NOT NULL,
  `title_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`title_id`,`language_id`),
  KEY `language_id` (`language_id`),
  CONSTRAINT `title_ibfk_1` FOREIGN KEY (`language_id`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `title`
--

LOCK TABLES `title` WRITE;
/*!40000 ALTER TABLE `title` DISABLE KEYS */;
INSERT INTO `title` VALUES (1,1,'かけだしのクイズ好き'),(1,2,'Novice Quiz Enthusiast'),(1,3,'Entusiasta de Quiz Iniciante'),(1,4,'Entusiasta de Cuestionarios Principiante'),(1,5,'初学者的测验爱好者'),(1,6,'初學者的測驗愛好者'),(1,7,'초보 퀴즈 애호가'),(1,8,'Baguhan na Mahilig sa Pagsusulit'),(1,9,'Người đam mê câu đố mới bắt đầu'),(1,10,'Penggemar Kuis Pemula'),(1,11,'सुरुवाती क्विज प्रेमी'),(2,1,'クイズビギナー'),(2,2,'Quiz Beginner'),(2,3,'Iniciante em Quiz'),(2,4,'Principiante en Cuestionarios'),(2,5,'测验初学者'),(2,6,'測驗初學者'),(2,7,'퀴즈 초보자'),(2,8,'Baguhan sa Pagsusulit'),(2,9,'Người mới bắt đầu câu đố'),(2,10,'Pemula Kuis'),(2,11,'क्विज प्रारम्भकर्ता'),(3,1,'知識コレクター'),(3,2,'Knowledge Collector'),(3,3,'Coletor de Conhecimento'),(3,4,'Coleccionista de Conocimientos'),(3,5,'知识收集者'),(3,6,'知識收集者'),(3,7,'지식 수집가'),(3,8,'Kolektor ng Kaalaman'),(3,9,'Nhà sưu tập kiến thức'),(3,10,'Pengumpul Pengetahuan'),(3,11,'ज्ञान सङ्कलक'),(4,1,'クイズチャレンジャー'),(4,2,'Quiz Challenger'),(4,3,'Desafiante de Quiz'),(4,4,'Desafiante de Cuestionarios'),(4,5,'测验挑战者'),(4,6,'測驗挑戰者'),(4,7,'퀴즈 도전자'),(4,8,'Tagapaghamon sa Pagsusulit'),(4,9,'Người thách thức câu đố'),(4,10,'Penantang Kuis'),(4,11,'क्विज चुनौती दिनेको'),(5,1,'文化のエキスパート'),(5,2,'Culture Expert'),(5,3,'Especialista em Cultura'),(5,4,'Experto en Cultura'),(5,5,'文化专家'),(5,6,'文化專家'),(5,7,'문화 전문가'),(5,8,'Eksperto sa Kultura'),(5,9,'Chuyên gia văn hóa'),(5,10,'Pakar Budaya'),(5,11,'संस्कृतिको विशेषज्ञ'),(6,1,'クイズマスター'),(6,2,'Quiz Master'),(6,3,'Mestre do Quiz'),(6,4,'Maestro de Cuestionarios'),(6,5,'测验大师'),(6,6,'測驗大師'),(6,7,'퀴즈 마스터'),(6,8,'Master ng Pagsusulit'),(6,9,'Bậc thầy câu đố'),(6,10,'Master Kuis'),(6,11,'क्विज गुरु'),(7,1,'スーパー頭脳'),(7,2,'Super Brain'),(7,3,'Super Cérebro'),(7,4,'Súper Cerebro'),(7,5,'超级大脑'),(7,6,'超級大腦'),(7,7,'슈퍼 두뇌'),(7,8,'Napakatalinong Utak'),(7,9,'Bộ não siêu cấp'),(7,10,'Otak Super'),(7,11,'सुपर मस्तिष्क'),(8,1,'知識ヒーロー'),(8,2,'Knowledge Hero'),(8,3,'Herói do Conhecimento'),(8,4,'Héroe del Conocimiento'),(8,5,'知识英雄'),(8,6,'知識英雄'),(8,7,'지식 영웅'),(8,8,'Bayani ng Kaalaman'),(8,9,'Anh hùng tri thức'),(8,10,'Pahlawan Pengetahuan'),(8,11,'ज्ञान नायक'),(9,1,'クイズのエリート'),(9,2,'Quiz Elite'),(9,3,'Elite do Quiz'),(9,4,'Élite del Cuestionario'),(9,5,'测验精英'),(9,6,'測驗精英'),(9,7,'퀴즈 엘리트'),(9,8,'Elit ng Pagsusulit'),(9,9,'Tinh hoa câu đố'),(9,10,'Elit Kuis'),(9,11,'क्विज अभिजात वर्ग'),(10,1,'クイズの天才'),(10,2,'Quiz Genius'),(10,3,'Gênio do Quiz'),(10,4,'Genio de Cuestionarios'),(10,5,'测验天才'),(10,6,'測驗天才'),(10,7,'퀴즈 천재'),(10,8,'Henyo ng Pagsusulit'),(10,9,'Thiên tài câu đố'),(10,10,'Jenius Kuis'),(10,11,'क्विज प्रतिभा'),(11,1,'世界の神'),(11,2,'God of the World'),(11,3,'Deus do Mundo'),(11,4,'Dios del Mundo'),(11,5,'世界之神'),(11,6,'世界之神'),(11,7,'세계의 신'),(11,8,'Diyos ng Mundo'),(11,9,'Thần thế giới'),(11,10,'Dewa Dunia'),(11,11,'संसारको देवता');
/*!40000 ALTER TABLE `title` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `main_language` int NOT NULL,
  `learn_language` int NOT NULL,
  `answer_count` int DEFAULT '0',
  `diary_count` int DEFAULT '0',
  `nickname` int DEFAULT '1',
  `is_admin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`,`team_id`),
  KEY `team_id` (`team_id`),
  KEY `main_language` (`main_language`),
  KEY `learn_language` (`learn_language`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`),
  CONSTRAINT `user_ibfk_2` FOREIGN KEY (`main_language`) REFERENCES `language` (`language_id`),
  CONSTRAINT `user_ibfk_3` FOREIGN KEY (`learn_language`) REFERENCES `language` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('01','sia','$2b$12$wFhV3AlokJDXhVF/PU3aN.YGSyx6QcFJtfURcw3NSaEmZWIdkicZy','ryo',1,3,0,1,1,0),('02','sia','$2b$12$vYJP/W2bpXeGkY8b3rRyJ.Qu/efNXUN5hLEkS2/RFwcR35vrbTBBi','tobisawa',3,1,0,0,1,0),('111','sia','$2b$12$dmr/0NgA.tPOZ3dASWc/z.1K.Fo2A2kxy7XgRjJMg6HwFdy882KqK','yamauchi',1,3,0,0,1,1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-17 22:43:37
