//
// Copyright 2022 New Vector Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import SwiftUI
import WysiwygComposer

/// Example SwiftUI that embeds the WysiwygComposerView in a bordered container
/// that grows to a max height.
struct Composer: View {
    @ObservedObject var viewModel: WysiwygComposerViewModel
    let minTextViewHeight: CGFloat = 20
    let borderHeight: CGFloat = 44
    
    var verticalPadding: CGFloat {
        (borderHeight - minTextViewHeight) / 2
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            let rect = RoundedRectangle(cornerRadius: borderHeight / 2)
            HStack {
                WysiwygComposerView(content: viewModel.content,
                                    replaceText: viewModel.replaceText,
                                    select: viewModel.select,
                                    didUpdateText: viewModel.didUpdateText)
                    .frame(height: viewModel.idealHeight)
                    .padding(.horizontal, 12)
                    .onAppear {
                        viewModel.setup()
                    }
            }
            .padding(.vertical, verticalPadding)
            .clipShape(rect)
            .overlay(rect.stroke(Color.gray, lineWidth: 2))
            .padding(.horizontal, 12)
            WysiwygActionToolbar { action in
                viewModel.apply(action)
            }
            .environmentObject(viewModel)
            .padding(.horizontal, 16)
        }
    }
}

struct Composer_Previews: PreviewProvider {
    static let viewModel = WysiwygComposerViewModel()
    static var previews: some View {
        Composer(viewModel: viewModel)
    }
}
