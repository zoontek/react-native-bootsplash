require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "RNBootSplash"

  s.version         = package["version"]
  s.license         = package["license"]
  s.summary         = package["description"]
  s.author          = package["author"]
  s.homepage        = package["homepage"]

  s.platforms       = { :ios => "11.0", :tvos => "11.0" }
  s.requires_arc    = true

  s.source          = { :git => package["repository"]["url"], :tag => s.version }
  s.source_files    = "ios/**/*.{h,m,mm}"

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    install_modules_dependencies(s)
  else
    s.dependency      "React-Core"
  end
end
