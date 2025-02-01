from langrid.clients import TranslationClient
from settings import lg_config
import asyncio

# 入力言語および出力言語のリスト
languages = {
    1: 'ja',  # 日本語
    2: 'en',  # 英語
    3: 'pt',  # ポルトガル語
    4: 'es',  # スペイン語
    5: 'zh-CN',  # 中国語（簡体字）
    6: 'zh-TW',  # 中国語（繁体字）
    7: 'ko',  # 韓国語
    8: 'tl',  # タガログ語
    9: 'vi',  # ベトナム語
    10: 'id',  # インドネシア語
    11: 'ne'  # ネパール語
}

# # async def translate_quizz(question,a,b,c,d):
# #     """
# #     日本語で作成されたクイズを他の言語に翻訳し、翻訳結果をリストに格納する関数。
# #     """
# #     translated_quiz_list = []
# #     gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
# #                              lg_config['userid'], lg_config['password'])
# #     i=1
# #     for target_lang_id in languages:
# #         target_lang = languages[target_lang_id]
# #         translation = []
# #         if i == 1:
# #             translation.append(question)
# #             translation.append(a)
# #             translation.append(b)
# #             translation.append(c)
# #             translation.append(d)
# #             translated_quiz_list.append(translation)
# #             i += 1
# #         else:
# #             # 質問文と選択肢を非同期に翻訳
# #             translation.append(gnmt.translate("ja",target_lang,question))
# #             translation.append(gnmt.translate("ja",target_lang,a))
# #             translation.append(gnmt.translate("ja",target_lang,b))
# #             translation.append(gnmt.translate("ja",target_lang,c))
# #             translation.append(gnmt.translate("ja",target_lang,d))
# #             translated_quiz_list.append(translation)
# #             i += 1
# #     return translated_quiz_list

# import asyncio

# async def translate_quizz(quizzes):
#     """
#     日本語で作成されたクイズを他の言語に翻訳し、翻訳結果をリストに格納する関数。
#     """
#     translated_quiz_list = []
#     gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
#                              lg_config['userid'], lg_config['password'])
    
#     async def translate_single_quiz(quiz):
#         """
#         1つのクイズをすべての言語に翻訳する
#         """
#         translations_per_quiz = []
#         for target_lang_id, target_lang in languages.items():
#             if target_lang_id == 1:  # 日本語（そのまま）
#                 translation = [quiz.question, quiz.a, quiz.b, quiz.c, quiz.d]
#             else:
#                 translation = await asyncio.gather(
#                     gnmt.translate("ja", target_lang, quiz.question),
#                     gnmt.translate("ja", target_lang, quiz.a),
#                     gnmt.translate("ja", target_lang, quiz.b),
#                     gnmt.translate("ja", target_lang, quiz.c),
#                     gnmt.translate("ja", target_lang, quiz.d)
#                 )
#             translations_per_quiz.append(translation)
#             print(translations_per_quiz)
#         return translations_per_quiz

#     # 全クイズを並列で翻訳
#     translated_quiz_list = await asyncio.gather(*[translate_single_quiz(quiz) for quiz in quizzes])
#     return translated_quiz_list  # クイズごとの翻訳リスト

async def translate_question(question, main_language):
    """
    指定された言語にクイズの質問を翻訳する関数。
    """
    gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
                             lg_config['userid'], lg_config['password'])
    lang = languages[main_language]

    # 翻訳の呼び出しを await で待機
    translated_question = gnmt.translate("ja", lang, question)
    return translated_question
import asyncio

# async def translate_quizz(quizzes):
#     """
#     日本語で作成されたクイズを他の言語に翻訳し、翻訳結果をリストに格納する関数。
#     """
#     translated_quiz_list = []
#     gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',
#                              lg_config['userid'], lg_config['password'])

#     async def translate_single_quiz(quiz):
#         """
#         1つのクイズをすべての言語に翻訳する
#         """
#         translations_per_quiz = []
#         for target_lang_id, target_lang in languages.items():
#             if target_lang_id == 1:  # 日本語（そのまま）
#                 translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]
#             else:
#                 # translateを非同期でラップ
#                 translation = await asyncio.gather(
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[0]),  # 質問
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[1]),  # 選択肢A
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[2]),  # 選択肢B
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[3]),  # 選択肢C
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[4])   # 選択肢D
#                 )
#             translations_per_quiz.append(translation)
#         return translations_per_quiz

#     translated_quiz_list = await asyncio.gather(*[translate_single_quiz(quiz) for quiz in quizzes])
#     return translated_quiz_list



# quizzes = [
#     ['クラス対抗のスポーツ大会では、一般的に何のために行われることが多いですか?', '成績を競う', '絆を深める', 'お金を稼ぐ', '給食を楽しむ'],
#     ['ブラジルの主要なスポーツ文化において、最も重要なイベントはどれですか?', 'ワールドカップ', 'オリンピック', 'NBAファイナル', 'WBC'],
#     ['学校の昼休みに食事の後によく行われるアクティビティは何ですか?', '掃除', '友達と遊ぶ', '勉強', '家に帰る'],
#     ['放課後に練習がある場合、どのような部活が一般的でしょうか?', '音楽部', '美術部', 'スポーツ部', '科学部'],
#     ['日本では、友達と一緒に遊ぶ行動を何と呼ぶことが多いですか?', '遊び', '付き合い', 'コミュニケーション', '社交']
# ]
# # 非同期で実行
# async def main():
#     translated_quizzes_to_save = await translate_quizz(quizzes)
#     print(translated_quizzes_to_save)

# # 実行
# asyncio.run(main())

# async def translate_quizz(quiz):
#     """
#     1つのクイズをすべての言語に翻訳する
#     """
#     gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT',lg_config['userid'], lg_config['password'])
#     translations_per_quiz = []
#     for target_lang_id, target_lang in languages.items():
#         try:
#             if target_lang_id == 1:  # 日本語（そのまま）
#                 translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]
#             else:
#                 # translateを非同期でラップ
#                 translation = await asyncio.gather(
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[0]),  # 質問
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[1]),  # 選択肢A
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[2]),  # 選択肢B
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[3]),  # 選択肢C
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[4])   # 選択肢D
#                 )
#         except Exception as e:
#             print(f"Error translating quiz: {quiz[0]} to {target_lang}. Error: {e}")
#             translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]  # 翻訳失敗時は元のデータを返す
#         translations_per_quiz.append(translation)
#         print(translations_per_quiz)
#     return translations_per_quiz


# async def translate_quizz(quiz):
#     """
#     1つのクイズをすべての言語に翻訳する
#     """
#     gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT', lg_config['userid'], lg_config['password'])
#     translations_per_quiz = []
#     for target_lang_id, target_lang in languages.items():
#         try:
#             if target_lang_id == 1:  # 日本語（そのまま）
#                 translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]
#             else:
#                 # translateを非同期でラップ
#                 translation = await asyncio.gather(
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[0]),  # 質問
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[1]),  # 選択肢A
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[2]),  # 選択肢B
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[3]),  # 選択肢C
#                     asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[4])   # 選択肢D
#                 )
#             # 翻訳結果をprintで表示して確認
#             print(f"Translation for {target_lang}: {translation}")
#         except Exception as e:
#             print(f"Error translating quiz: {quiz[0]} to {target_lang}. Error: {e}")
#             translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]  # 翻訳失敗時は元のデータを返す
#         translations_per_quiz.append(translation)
#         # translations_per_quizの途中経過を確認
#         print(f"Translations so far: {translations_per_quiz}")
    
#     # 最終的なtranslations_per_quizの内容を確認
#     print(f"Final translations_per_quiz: {translations_per_quiz[0]}")
#     return translations_per_quiz

async def translate_quizz(quiz_set):
    """
    複数のクイズセットをすべての言語に翻訳する
    """
    gnmt = TranslationClient('http://langrid.org/service_manager/wsdl/kyoto1.langrid:GoogleTranslateNMT', lg_config['userid'], lg_config['password'])
    translations_per_quiz_set = []  # すべてのクイズセットの翻訳結果を保持

    for quiz in quiz_set:
        translations_per_quiz = []  # 現在のクイズセットの翻訳結果を保持
        for target_lang_id, target_lang in languages.items():
            try:
                if target_lang_id == 1:  # 日本語（そのまま）
                    translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]
                else:
                    # translateを非同期でラップ
                    translation = await asyncio.gather(
                        asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[0]),  # 質問
                        asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[1]),  # 選択肢A
                        asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[2]),  # 選択肢B
                        asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[3]),  # 選択肢C
                        asyncio.to_thread(gnmt.translate, "ja", target_lang, quiz[4])   # 選択肢D
                    )
                
                # 翻訳結果をリストに追加
                translations_per_quiz.append(translation)
            except Exception as e:
                print(f"Error translating quiz: {quiz[0]} to {target_lang}. Error: {e}")
                # 翻訳失敗時は元のデータを返す
                translation = [quiz[0], quiz[1], quiz[2], quiz[3], quiz[4]]
                translations_per_quiz.append(translation)

        # 現在のクイズセットの翻訳結果を保存
        translations_per_quiz_set.append(translations_per_quiz)

    # 最終的な翻訳結果を確認
    print(f"Final translations_per_quiz_set: {[', '.join([', '.join(t) for t in quiz]) for quiz in translations_per_quiz_set]}")
    
    return translations_per_quiz_set
