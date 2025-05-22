def quiz_to_dict(quiz):
    return {
        "id": quiz.cash_quiz_id,  # cash_quiz_id を id に変換
        "question": quiz.question,
        "correct": quiz.correct,
        "a": quiz.a,
        "b": quiz.b,
        "c": quiz.c,
        "d": quiz.d,
    }

age_map = {
    "Elementary1": 1, "Elementary2": 2, "Elementary3": 3,
    "Elementary4": 4, "Elementary5": 5, "Elementary6": 6,
    "Junior1": 7, "Junior2": 7, "Junior3": 7,
    "Other": 8
}

answer_dic = {
    "a" : 1,
    "b" : 2,
    "c" : 3,
    "d" : 4
}

language_map = {
    1: "ja",  # 日本語
    2: "en",  # 英語
    3: "pt",  # ポルトガル語
    4: "es",  # スペイン語
    5: "zh",  # 簡体中文 # gTTSではzh-CNやzh-TWではなくzh
    6: "zh",  # 繁体中文
    7: "ko",  # 韓国語
    8: "tl",  # タガログ語
    9: "vi",  # ベトナム語
    10: "id", # インドネシア語
    11: "ne", # ネパール語
} 