(ns fract.core
  (:use compojure.core hiccup.core)
  (:require [compojure.route :as route]
            [compojure.handler :as handler]))

(defroutes main-routes
  (GET "/" [] (html 
[:html
 [:head
  [:title "Fract!"]
  ]
 [:body
  [:div.container {:contenteditable "true" :style "white-space: pre; padding: 5em;"}
   "some starting text"
   ]
  [:script {:type "text/javascript" :src "libs/jquery.js"}]
  [:script {:type "text/javascript" :src "js/main.js"}]
  ]
 ]))
(route/resources "/")
(route/not-found "Page not found"))

(def app
  (handler/site main-routes))
