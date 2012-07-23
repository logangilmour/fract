(ns fractjs.core
  (:use
   [jayq.core :only [$ on attr text inner trigger]])
  (:require-macros
   [hiccups.core :as hic])
  (:require
   [fract.shared.sentence :as sen]
   [hiccups.runtime :as hiccupsrt]
   [clojure.string :as st]))

(on ($ :div.container) :keyup ""
    (fn [evt]
      (let [elem ($ :div.container)]
        (-> js/window .getSelection (.getRangeAt 0) (.insertNode (.get ($ "<span id='selection'/>") 0)))
        (.html elem (apply str (map spanify (-> elem .contents .toArray))))
        ;; (.html elem (map spanify (-> elem (.get 0) .-childNodes)))
        (let [range (.createRange js/document)
              mark (-> :span#selection $)
              markEl (-> mark (.get 0))
              sel (-> js/document .getSelection)]
          (.setStartAfter range markEl)
          (.setEndAfter range markEl)
          (-> sel .removeAllRanges)
          (-> sel (.addRange range))
          (-> mark .remove))
         )))

;;range.setStartAfter(newNode);
;;range.setEndAfter(newNode); 
;;sel.removeAllRanges();
;;sel.addRange(range);
    
        ;;(.html elem (str (hic/html (sen/transform (.text elem)))))
       ;; (-> range (.setStart elem pos))
        ;;(-> range (.collapse true))
        ;;(-> sel .removeAllRanges)
        ;;(-> sel (.addRange range)))))
        ;;var el = document.getElementById("editable");
        ;;var range = document.createRange();
        ;;var sel = window.getSelection();
        ;;range.setStart(el.childNodes[2], 5);
        ;;range.collapse(true);
        ;;sel.removeAllRanges();
        ;;sel.addRange(range);



(defn spanify [elem]
  (let [content (-> elem $ .html)
        id (-> elem $ (attr "id"))
        ntype (-> elem .-nodeType)
        nname (-> elem .-nodeName)]
    (cond
     (= ntype 1) (cond
                  (= nname "SPAN") (sen/spanner content id)
                  :else content)
     ;;(= ntype 3) (sen/spanner content nil)
     :else "?")))

(-> :div.container $ (.html "<span id='0'>test</span>"))