(defproject fract "0.1.0-SNAPSHOT"
  :description "A recursive text editor"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.1.1"]
                 [hiccup "1.0.0"]
                 [jayq "0.1.0-alpha2"]
                 [hiccups "0.1.1"]]
   :plugins [
    [lein-cljsbuild "0.2.4"]
    [lein-ring "0.7.1"]
  ]
  :ring {:handler fract.core/app}
  :cljsbuild
  {:crossovers [fract.shared]
   :crossover-path "crossover-cljs"
   :builds
   [{:source-path "src-cljs"
     :compiler
     {:externs ["resources/public/libs/jquery.js"]
      :output-to "resources/public/js/main.js"
      :optimizations :whitespace
      :pretty-print true}}]})
