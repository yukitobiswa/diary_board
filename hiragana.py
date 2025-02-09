

import json
from urllib import request

age_map = {
    "Elementary1" : 1,
    "Elementary2" : 2,
    "Elementary3" : 3,
    "Elementary4" : 4,
    "Elementary5" : 5,
    "Elementary6" : 6,
    "Junior1" : 7,
    "Junior2" : 7,
    "Junior3" : 7,
    "Other" : 8
}
APPID = "dj00aiZpPTZqbTZSOEVqdDZhaiZzPWNvbnN1bWVyc2VjcmV0Jng9Yzk-"  # <-- ここにあなたのClient ID（アプリケーションID）を設定してください。
URL = "https://jlp.yahooapis.jp/FuriganaService/V2/furigana"  # 🔥 URLは変更しない

def post(query,grade):
    """ Yahoo API を使ってカナ文字変換する """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Yahoo AppID: {}".format(APPID),
    }
    param_dic = {
        "id": "1234-1",
        "jsonrpc": "2.0",
        "method": "jlp.furiganaservice.furigana",
        "params": {
            "q": query,
            "grade": grade  # ✅ すべての漢字をカナに変換（小学1年生相当）
        }
    }
    params = json.dumps(param_dic).encode()
    req = request.Request(URL, params, headers)
    
    try:
        with request.urlopen(req) as res:
            body = res.read()
        return json.loads(body.decode())  # ✅ JSONとして解析して返す
    except Exception as e:
        print(f"⚠️ APIリクエスト失敗: {e}")
        return None

def convert_to_kana(response):
    """ Yahoo API のレスポンスをカナ文字に変換 """
    if not response or "result" not in response:
        return "⚠️ 変換に失敗しました。"

    result_text = ""
    for word in response["result"]["word"]:
        if "furigana" in word:
            result_text += word["furigana"]  # ✅ ふりがなを取得
        else:
            result_text += word["surface"]  # ✅ ひらがながない場合、そのまま

    return result_text
def convert_quiz_to_kana(quiz_data, age):
    """ クイズデータの question と choices をカナに変換 """
    new_quiz_data = []

    if age not in age_map:
        print(f"⚠️ 無効な年齢 '{age}' が指定されました。デフォルトで 'Other' を使用します。")
        age = "Other"

    for quiz in quiz_data:
        response_question = post(quiz["question"], age_map[age])
        kana_question = convert_to_kana(response_question)

        kana_choices = []
        for choice in quiz["choices"]:
            response_choice = post(choice, age_map[age])
            kana_choices.append(convert_to_kana(response_choice))

        new_quiz_data.append({
            "question": kana_question,
            "choices": kana_choices,
            "answer": quiz["answer"]
        })

    return new_quiz_data
